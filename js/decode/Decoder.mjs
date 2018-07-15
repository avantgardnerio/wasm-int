import opcodes from './opcodes.mjs';

const depths = {
    'if': 1,
    'block': 1,
    'loop': 1,
    'end': -1
}

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
                throw new Error('Error running op: ' + key, ex);
            }
        } while(depth >= 0 || opcode !== 0x0B);
        return instructions;
    }
}