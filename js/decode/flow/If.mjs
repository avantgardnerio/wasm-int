import OpCode from '../OpCode.mjs';

export default class If extends OpCode {

    decode(reader) {
        const type = reader.readVarInt();
        return { op: 'if', type };
    }

    static get code() {
        return 0x04;
    }
}