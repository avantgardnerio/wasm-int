import OpCode from "../OpCode.mjs";

export default class GeS extends OpCode {

    decode(reader) {
        return { op: 'i32.ge_s' };
    }

    static get code() {
        return 0x4E;
    }
}