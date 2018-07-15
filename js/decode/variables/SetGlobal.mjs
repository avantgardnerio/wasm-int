import OpCode from '../OpCode.mjs';

export default class SetGlobal extends OpCode {

    decode(reader) {
        const globalIndex = reader.readVarUint();
        return { op: 'set_global', globalIndex };
    }

    static get code() {
        return 0x24;
    }
}