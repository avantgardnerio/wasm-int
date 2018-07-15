import OpCode from '../OpCode.mjs';

export default class NoOp extends OpCode {

    decode(reader) {
        return { op: 'nop' };
    }

    static get code() {
        return 0x01;
    }
}