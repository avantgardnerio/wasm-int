import OpCode from '../OpCode.mjs';

export default class Block extends OpCode {

    decode(reader) {
        const type = reader.readVarUint();
        return { op: 'block', type };
    }

    static get code() {
        return 0x02;
    }
}