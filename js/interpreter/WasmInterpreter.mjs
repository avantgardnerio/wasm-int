export default class WasmInterpreter {
    constructor(module) {
        this.module = module;
        this.stack = [];
        this.globals = new Array(module.imports.globals.length + module.globals.length);
        for(let i = 0; i < module.globals.length; i++) {
            const global = module.globals[i];
            const initVal = this.exec(global.initExpr);
            this.globals[i + module.imports.globals.length] = initVal;
        }
    }

    exec(ops, stack = []) {
        let ip = 0;
        while(true) {
            const op = ops[ip];
            switch(op.op) {
                case 'i32.const':
                    stack.push(op.value);
                    break;
                case 'f32.const':
                    stack.push(op.value);
                    break;
                case 'end':
                    return stack.pop();
                default:
                    throw new Error('Unknown opcode: ' + op.op);
            }
            ip++;
        }
    }

    invoke(functionName, ...args) {
        const func = this.module.exports.functions[functionName];
        if(func.signature.parameterTypes.length !== args.length) {
            throw new Error('Argument length mismatch!');
        }
        let ip = 0;
        while(true) {
            const op = func.body.code[ip];
            switch(op.op) {
                case 'get_local':
                    const val = args[op.localIndex];
                    this.stack.push(val);
                    break;
                case 'get_global':
                    const val2 = this.globals[op.globalIndex];
                    this.stack.push(val2);
                    break;
                case 'i32.const':
                    this.stack.push(op.value);
                    break;
                case 'i32.add':
                    const a = this.stack.pop();
                    const b = this.stack.pop();
                    const res = a + b;
                    this.stack.push(res);
                    break;
                case 'end':
                    if(type.returnTypes.length > 1) {
                        throw new Error('Multiple return types not implemented!');
                    }
                    if(type.returnTypes.length === 0) {
                        return;
                    }
                    const finalResult = this.stack.pop();
                    return finalResult;
                default:
                    throw new Error('Unknown opcode: ' + op.op);
            }
            ip++;
        }
    }
}