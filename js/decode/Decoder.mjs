import opcodes from './opcodes.mjs';

export default class Decoder {
    constructor(reader) {
        this.reader = reader;
    }

    decode() {
        const instructions = [];
        let opcode;
        do {
            opcode = this.reader.getUint8();
            const key = '0x' + ('00' + opcode.toString(16)).substr(-2);
            const decoder = opcodes[key]; // TODO: kill string BS
            if(!decoder) {
                throw new Error('Unknown opcode: ' + opcode);
            }
            const op = decoder(this.reader);
            instructions.push(op);
        } while(opcode !== 0x0B);
        return instructions;
    }
}