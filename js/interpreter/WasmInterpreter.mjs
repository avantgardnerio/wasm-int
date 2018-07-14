export default class WasmInterpreter {
    constructor(modules) {
        this.modules = modules;
        this.stack = [];
    }

    invoke(functionName, ...args) {
        for(let module of this.modules) {
            const exports = module.sections.find(s => s.type === 'Export');
            const funcIdxs = module.sections.find(s => s.type === 'Function');
            const bodies = module.sections.find(s => s.type === 'Code');
            const types = module.sections.find(s => s.type === 'Types');
            const functions = exports.exports.filter(e => e.kind === 'Function');
            const func = functions.find(f => f.field === functionName);
            const typeIdx = funcIdxs.functionSignatureIndices[func.index];
            const body = bodies.functions[func.index];
            const type = types.functionSignatures[typeIdx];
            if(type.parameterTypes.length !== args.length) {
                throw new Error('Argument length mismatch!');
            }
            let ip = 0;
            while(true) {
                const op = body.code[ip];
                switch(op.op) {
                    case 'get_local':
                        const val = args[op.localIndex];
                        this.stack.push(val);
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