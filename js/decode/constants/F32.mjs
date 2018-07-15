import OpCode from "../OpCode.mjs";

export default class F32 extends OpCode {

    decode(reader) {
        const value = reader.getFloat32();
        return {op: 'f32.const', value };
    }

    static get code() {
        return 0x43;
    }
}