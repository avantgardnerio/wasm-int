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

const modules = {
   env: {
       memoryBase: 1024,
       tableBase: 0,
       STACKTOP: 2080,
       STACK_MAX: 5244960
   }
};

export default class WasmInterpreter {
    constructor(module) {
        this.module = module;
        this.stack = [];
        this.callStack = [];
        this.globals = new Array(module.imports.globals.length + module.globals.length);
        for(let i = 0; i < module.imports.globals.length; i++) {
            const global = module.imports.globals[i];
            const initVal = modules[global.module][global.field];
            this.globals[i] = initVal;
        }
        for (let i = 0; i < module.globals.length; i++) {
            const global = module.globals[i];
            const initVal = this.exec(global.initExpr, undefined);
            this.globals[i + module.imports.globals.length] = initVal;
        }
    }

    get stackFrame() {
        if(this.callStack.length <= 0) return undefined;
        return this.callStack[this.callStack.length-1];
    }

    get instructions() {
        // TODO: inst is clearly a bad name, given inst.instructions
        return this.stackFrame.inst.instructions;
    }

    get currentInst() {
        return this.instructions[this.stackFrame.ip];
    }

    exec(inst, locals) {
        if(this.callStack.length !== 0) throw new Error('Already executing!');
        this.callStack.push({ inst, ip: 0 });
        while (true) {
            switch (this.currentInst.op) {
                case 'if':
                    this.if();
                    break;
                case 'return':
                    return this.return(); // TODO: recursive function calls
                case 'call':
                    throw new Error('TODO');
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
                        inst(this.currentInst, this.stack, locals, this.globals);
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

    invoke(functionName, ...args) {
        const func = this.module.exports.functions[functionName];
        if (func.signature.parameterTypes.length !== args.length) {
            throw new Error('Argument length mismatch!');
        }
        const locals = [...args, ...func.body.localVariables.map(v => defaults[v])];
        const result = this.exec(func.body.code, locals);
        return result;
    }

    // --------------------------------------- instructions -----------------------------------------------------------
    return() {
        console.log('return');
        const res = this.stack.pop();
        this.callStack = [];
        return res;
    }

    if() {
        const conditionExprRes = this.stack.pop();
        if(conditionExprRes === 1) {
            console.log('recurse into true clause of if');
            this.callStack.push({inst: this.currentInst.true, ip: -1});
            return;
        }
        if(this.currentInst.false !== undefined) {
            console.log('recurse into false clause of if');
            this.callStack.push({inst: this.currentInst.false, ip: -1}); // enter else
            return;
        }
        console.log('ignoring empty false clause');
    }

    block() {
        console.log('recurse into block');
        this.callStack.push({inst: this.currentInst, ip: -1});
    }

    loop() {
        console.log('begin loop');
        this.callStack.push({inst: this.currentInst, ip: -1});
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