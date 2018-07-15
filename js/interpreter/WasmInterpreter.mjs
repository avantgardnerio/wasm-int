export default class WasmInterpreter {
    constructor(modules) {
        this.modules = modules;
        this.stack = [];
    }

    invoke(functionName, ...args) {
        for(let module of this.modules) {
            const func = module.exports.functions[functionName];
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
                        throw new Error('TODO');
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
                        throw new Error('Unknown opcode: ', op.op);
                }
                ip++;
            }
        }
    }
}