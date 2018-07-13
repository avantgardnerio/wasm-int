import OpCode from "../OpCode.mjs";

export default class I32 extends OpCode {

    decode(reader) {
        const value = reader.readVarInt();
        return {op: 'i32.const', value };
    }

    static get code() {
        return 0x41;
    }
}