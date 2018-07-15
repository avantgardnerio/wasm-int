import OpCode from '../OpCode.mjs';

export default class SetLocal extends OpCode {

    decode(reader) {
        const localIndex = reader.readVarUint();
        return { op: 'set_local', localIndex };
    }

    static get code() {
        return 0x21;
    }
}