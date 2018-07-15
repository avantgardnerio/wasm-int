import instructions from './instructions.mjs';

const defaults = {
    'i32': 0
};

const depths = {
    'if': 1,
    'block': 1,
    'loop': 1,
    'end': -1
}

export default class WasmInterpreter {
    constructor(module) {
        this.module = module;
        this.stack = [];
        this.globals = new Array(module.imports.globals.length + module.globals.length);
        for (let i = 0; i < module.globals.length; i++) {
            const global = module.globals[i];
            const initVal = this.exec(global.initExpr);
            this.globals[i + module.imports.globals.length] = initVal;
        }
    }

    exec(ops, stack = [], locals, globals) {
        let depth = 1;
        let ip = 0;
        while (true) {
            const op = ops[ip];
            switch (op.op) {
                case 'if':
                    if(stack.pop() !== true) {
                        for(let d = 0; d > 1 || ops[ip].op !== 'end'; ip++) {
                            d += (depths[ops[ip].op] || 0);
                        }
                        // TODO: else
                    }
                    break;
                case 'return':
                    return stack.pop();
                case 'call':
                    throw new Error('TODO');
                case 'end':
                    depth--;
                    // TODO: while, block
                    if (depth === 0) return stack.pop();
                default:
                    const inst = instructions[op.op];
                    if (!inst) throw new Error('Unknown opcode: ' + op.op);
                    try {
                        inst(op, stack, locals, globals);
                    } catch(ex) {
                        throw new Error('Error running op: ' + op.op, ex);
                    }
            }
            ip++;
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