import OpCode from '../OpCode.mjs';

export default class Call extends OpCode {

    decode(reader) {
        const functionIndex = reader.readVarUint();
        return { op: 'call', functionIndex };
    }

    static get code() {
        return 0x10;
    }
}