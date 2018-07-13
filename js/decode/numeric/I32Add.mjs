import OpCode from '../OpCode.mjs';

export default class I32Add extends OpCode {

    decode(reader) {
        return { op: 'i32.add' };
    }

    static get code() {
        return 0x6a;
    }
}