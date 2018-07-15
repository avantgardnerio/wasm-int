import instructions from './instructions.mjs';

const defaults = {
    'i32': 0
};

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

    exec(ops, stack = [], locals, globals) {
        let ip = 0;
        while(true) {
            const op = ops[ip];
            const inst = instructions[op.op];
            if(!inst) throw new Error('Unknown opcode: ' + op.op);
            const ret = inst(op, stack, locals, globals);
            if(typeof ret === 'function') return ret();
            ip++;
        }
    }

    invoke(functionName, ...args) {
        const func = this.module.exports.functions[functionName];
        if(func.signature.parameterTypes.length !== args.length) {
            throw new Error('Argument length mismatch!');
        }
        const locals = [...args, ...func.body.localVariables.map(v => defaults[v])];
        this.exec(func.body.code, this.stack, locals, this.globals);
    }
}