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
            const initVal = this.exec(global.initExpr, [], undefined, this.globals);
            this.globals[i + module.imports.globals.length] = initVal;
        }
    }

    get stackFrame() {
        if(this.callStack.length <= 0) return undefined;
        return this.callStack[this.callStack.length-1];
    }

    get instructions() {
        return this.stackFrame.inst.instructions; // TODO: WTF
    }

    exec(inst, stack = [], locals, globals) {
        if(this.callStack.length !== 0) throw new Error('Already executing!');
        this.callStack.push({ inst, ip: 0 });
        while (true) {
            const op = this.instructions[this.stackFrame.ip];
            switch (op.op) {
                case 'if':
                    if(stack.pop() === true) {
                        this.callStack.push({inst: op.true, ip: 0});
                    } else {
                        if(op.false !== undefined) {
                            this.callStack.push({inst: op.false, ip: 0}); // enter else
                        } // else: nothing to do, keep executing
                    }
                    break;
                case 'return':
                    return stack.pop();
                case 'call':
                    throw new Error('TODO');
                case 'block':
                    this.callStack.push({inst: op, ip: -1});
                    break;
                case 'loop':
                    this.callStack.push({inst: op, ip: -1});
                    break;
                case 'br':
                    let depth = op.depth;
                    while(depth > 0) {
                        if(['loop', 'block'].includes(this.stackFrame.inst.op)) {
                            depth--;
                        }
                        this.callStack.pop();
                    }
                    break;
                case 'end':
                    switch (this.stackFrame.inst.op) {
                        case 'block':
                            this.callStack.pop();
                            if(this.callStack.length === 0) {
                                return this.stack.pop();
                            }
                            break;
                        case 'loop':
                            this.stackFrame.ip = -1;
                            break;
                        default:
                            throw new Error("Can't exit op: " + this.stackFrame.inst.op)
                    }
                    break;
                default:
                    const inst = instructions[op.op];
                    if (!inst) throw new Error('Unknown opcode: ' + op.op);
                    try {
                        inst(op, stack, locals, globals);
                    } catch(ex) {
                        throw new Error('Error running op: ' + op.op, ex);
                    }
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
        const result = this.exec(func.body.code, this.stack, locals, this.globals);
        return result;
    }
}