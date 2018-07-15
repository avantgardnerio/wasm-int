import Reader from "../stream/Reader.mjs";

import opcodes from './opcodes.mjs';

export default class Decoder {
    constructor(reader) {
        this.reader = reader;
        this.opcodes = opcodes.reduce((acc, cur) => {
            return {...acc, [cur.code]: new cur()}
        }, {});
    }

    decode() {
        const instructions = [];
        let opcode;
        do {
            opcode = this.reader.getUint8();
            const decoder = this.opcodes[opcode];
            if(!decoder) {
                throw new Error('Unknown opcode: ' + opcode);
            }
            const op = decoder.decode(this.reader);
            instructions.push(op);
        } while(opcode !== 0x0B);
        return instructions;
    }
}