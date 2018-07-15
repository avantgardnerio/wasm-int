import OpCode from '../OpCode.mjs';

export default class GetGlobal extends OpCode {

    decode(reader) {
        const globalIndex = reader.readVarUint();
        return { op: 'get_global', globalIndex };
    }

    static get code() {
        return 0x23;
    }
}