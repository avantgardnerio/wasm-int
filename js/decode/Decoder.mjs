import Reader from "../stream/Reader.mjs";

import opcodes from './opcodes.mjs';

export default class Decoder {
    constructor(buffer) {
        this.buffer = buffer;
        this.reader = new Reader(buffer);
        this.opcodes = opcodes.reduce((acc, cur) => {
            return {...acc, [cur.code]: new cur()}
        }, {});
    }

    decode() {
        const instructions = [];
        while(this.reader.available) {
            const opcode = this.reader.getUint8();
            const decoder = this.opcodes[opcode];
            if(!decoder) throw new Error('Unknown opcode: ' + opcode);
            const op = decoder.decode(this.reader);
            instructions.push(op);
        }
        return instructions;
    }
}