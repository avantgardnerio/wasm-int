import instructions from './instructions.mjs';

const defaults = {
    'i32': 0
};

const depths = {
    'if': 1,
    'block': 1,
    'loop': 1,
    'end': -1
};

const PG_SIZE = 64 * 1024; // https://webassembly.github.io/spec/core/exec/runtime.html#memory-instances

const modules = {
   env: {
       memoryBase: 1024,
       tableBase: 0,
       STACKTOP: 2080,
       STACK_MAX: 5244960,
       exports: {
           functions: {
               _llvm_stacksave: (t) => {
                   console.log(t);
               }
           }
       }
   }
};

export default class WasmInterpreter {
    constructor(module, TextDecoder) {
        this.module = module;
        if(TextDecoder) this.textDecoder = new TextDecoder('utf-8');

        this.stack = [];
        this.callStack = [];
        this.globals = new Array(module.imports.globals.length + module.globals.length);

        // globals
        for(let i = 0; i < module.imports.globals.length; i++) {
            const global = module.imports.globals[i];
            const initVal = modules[global.module][global.field];
            this.globals[i] = initVal;
        }
        for (let i = 0; i < module.globals.length; i++) {
            const global = module.globals[i];
            this.callStack.push({ inst: global.initExpr, ip: 0, locals: [], type: 'call' });
            const initVal = this.exec();
            this.globals[i + module.imports.globals.length] = initVal;
        }

        // data
        const dataEntries = module.data.map(cur => {
            this.callStack.push({ inst: cur.offset, ip: 0, locals: [], type: 'call' });
            const offset = this.exec();
            return {offset, bytes: new Uint8Array(cur.bytes)}
        });
        const memSize = dataEntries.reduce((acc, cur) => Math.max(acc, cur.offset + cur.bytes.byteLength), 0) || 1;
        this.memory = new Uint8Array(Math.ceil(memSize / PG_SIZE) * PG_SIZE);
        this.memView = new DataView(this.memory.buffer);
        dataEntries.forEach(e => this.memory.set(e.bytes, e.offset));
    }

    // ------------------------------------- accessors ----------------------------------------------------------------
    get stackFrame() {
        if(this.callStack.length <= 0) return undefined;
        return this.callStack[this.callStack.length-1];
    }

    get instructions() {
        // TODO: inst is clearly a bad name, given inst.instructions
        return this.stackFrame.inst.instructions;
    }

    get locals() {
        return this.stackFrame.locals;
    }

    get currentInst() {
        return this.instructions[this.stackFrame.ip];
    }

    get frameType() {
        return this.stackFrame.type;
    }

    // ------------------------------------- public methods -----------------------------------------------------------
    invoke(functionName, ...args) {
        const func = this.module.exports.functions[functionName];
        if (func.signature.parameterTypes.length !== args.length) {
            throw new Error('Argument length mismatch!');
        }
        const locals = [...args, ...func.body.localVariables.map(v => defaults[v])];
        this.callStack.push({ inst: func.body.code, ip: 0, locals, type: 'call' });
        const result = this.exec();
        return result;
    }

    readString(start) {
        let end = start;
        while(end < this.memory.byteLength && this.memory[end] !== 0) end++;
        const bytes = this.memory.slice(start, end);
        const str = this.textDecoder.decode(bytes);
        return str;
    }

    exec() {
        while (true) {
            switch (this.currentInst.op) {
                case 'if':
                    this.if();
                    break;
                case 'return':
                    this.return();
                    break;
                case 'call':
                    this.call();
                    break;
                case 'block':
                    this.block();
                    break;
                case 'loop':
                    this.loop();
                    break;
                case 'br':
                    this.br();
                    break;
                case 'end':
                    this.end();
                    break;
                default:
                    const inst = instructions[this.currentInst.op];
                    if (!inst) throw new Error('Unknown opcode: ' + this.currentInst.op);
                    //console.log('execute ', op.op);
                    try {
                        inst(this.currentInst, this.stack, this.locals, this.globals, this.memView);
                    } catch(ex) {
                        throw new Error('Error running op: ' + this.currentInst.op, ex);
                    }
            }
            if(this.callStack.length === 0) {
                return this.stack.pop();
            }
            this.stackFrame.ip++;
        }
    }

    // --------------------------------------- instructions -----------------------------------------------------------
    call() {
        let funcIdx = this.currentInst.functionIndex;
        if(funcIdx < this.module.imports.functions.length) {
            const funcImport = this.module.imports.functions[funcIdx];
            const module = modules[funcImport.module];
            const importedFunc = module.exports.functions[funcImport.field];
            if(typeof importedFunc === 'function') {

            } else {

            }
            throw new Error('TODO: call imported functions');
        }
        funcIdx -= this.module.imports.functions.length;
        const func = this.module.functions[funcIdx];
        const args = func.signature.parameterTypes.map(t => this.stack.pop()); // TODO: verfify param order on stack
        const locals = [...args, ...func.body.localVariables.map(v => defaults[v])];
        console.log(`calling ${func.name} with args: `, args);
        this.callStack.push({ inst: func.body.code, ip: 0, locals, type: 'call' });
    }

    return() {
        console.log('return');
        while(this.frameType !== 'call') {
            this.callStack.pop();
        }
        this.callStack.pop();
    }

    if() {
        const conditionExprRes = this.stack.pop();
        if(conditionExprRes === 1) {
            console.log('recurse into true clause of if');
            this.callStack.push({inst: this.currentInst.true, ip: -1, locals: this.locals, type: 'if'});
            return;
        }
        if(this.currentInst.false !== undefined) {
            console.log('recurse into false clause of if');
            this.callStack.push({inst: this.currentInst.false, ip: -1, locals: this.locals, type: 'else'});
            return;
        }
        console.log('ignoring empty false clause');
    }

    block() {
        console.log('recurse into block');
        this.callStack.push({inst: this.currentInst, ip: -1, locals: this.locals, type: 'block'});
    }

    loop() {
        console.log('begin loop');
        this.callStack.push({inst: this.currentInst, ip: -1, locals: this.locals, type: 'loop'});
    }

    br() {
        let depth = this.currentInst.depth;
        console.log('break depth=', depth);
        while(depth >= 0) {
            console.log('break from ', this.stackFrame.inst.op);
            switch(this.stackFrame.inst.op) {
                case 'if.true':
                case 'if.false':
                case 'block':
                    depth--;
                    this.callStack.pop();
                    break;
                case 'loop':
                    depth--;
                    this.stackFrame.ip = -1;
                    if(depth >= 0) {
                        this.callStack.pop();
                    }
                    break;
                default:
                    throw new Error('TODO');
            }
        }
    }
    
    end() {
        switch (this.stackFrame.inst.op) {
            case 'if.true':
                console.log('end if');
                this.callStack.pop();
                break;
            case 'if.false':
                console.log('end else');
                this.callStack.pop();
                break;
            case 'block':
                console.log('end block');
                this.callStack.pop();
                break;
            case 'loop':
                console.log('end loop');
                this.callStack.pop();
                break;
            default:
                throw new Error("Can't exit op: " + this.stackFrame.inst.op)
        }
    }
}