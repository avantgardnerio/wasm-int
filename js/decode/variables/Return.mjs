import OpCode from '../OpCode.mjs';

export default class Return extends OpCode {

    decode(reader) {
        return { op: 'return' };
    }

    static get code() {
        return 0x0F;
    }
}