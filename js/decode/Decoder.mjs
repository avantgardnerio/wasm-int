import opcodes from './opcodes.mjs';

const depths = {
    'if': 1,
    'block': 1,
    'loop': 1,
    'end': -1
};

export default class Decoder {
    constructor(reader) {
        this.reader = reader;
    }

    decode() {
        const instructions = [];
        let opcode;
        let depth = 0;
        do {
            opcode = this.reader.getUint8();
            const key = '0x' + ('00' + opcode.toString(16)).substr(-2);
            const decoder = opcodes[key]; // TODO: kill string BS
            if(!decoder) {
                throw new Error('Unknown opcode: ' + opcode);
            }
            try {
                const op = decoder(this.reader);
                depth += (depths[op.op] || 0);
                instructions.push(op);
            } catch(ex) {
                throw new Error('Error decoding op: ' + key, ex);
            }
        } while(depth >= 0 || opcode !== 0x0B);
        const nested = this.nest(instructions);
        return nested;
    }

    nest(instructions) {
        const base = {op: 'block', instructions: []};
        const stack = [base];
        for(let i = 0; i < instructions.length; i++) {
            let inst = instructions[i];
            stack[stack.length-1].instructions.push(inst);
            if(['block', 'loop'].includes(inst.op)) {
                inst.instructions = [];
                stack.push(inst);
            }
            if(inst.op === 'if') {
                inst.true = {op: 'if.true', instructions: []};
                stack.push(inst.true);
            }
            if(inst.op === 'else') {
                stack.pop();
                const insts = stack[stack.length-1].instructions;
                inst = insts[insts.length-1];
                inst.false = {op: 'if.false', instructions: []};
                stack.push(inst.false);
            }
            if(depths[inst.op] === -1) {
                stack.pop();
            }
        }
        return base;
    }
}