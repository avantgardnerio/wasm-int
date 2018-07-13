import OpCode from '../OpCode.mjs';

export default class GetLocal extends OpCode {

    decode(reader) {
        const localIndex = reader.readVarUint();
        return { op: 'get_local', localIndex };
    }

    static get code() {
        return 0x20;
    }
}