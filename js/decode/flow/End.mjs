import OpCode from '../OpCode.mjs';

export default class End extends OpCode {

    decode(reader) {
        return { op: 'end' };
    }

    static get code() {
        return 0x0b;
    }
}