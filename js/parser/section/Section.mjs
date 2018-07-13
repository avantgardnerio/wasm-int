export default class Section {
    constructor(reader) {
        this.reader = reader;
    }

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#resizable_limits
    parseResizableLimits() {
        const flags = this.reader.readVarUint();
        const initial = this.reader.readVarUint();
        const resizableLimits = {initial};
        if(flags === 1) {
            resizableLimits.maximum = this.reader.readVarUint();
        }
        return resizableLimits;
    }

    parse(reader) {
        throw new Error('Not implemented');
    }

    static get type() {
        throw new Error('Not implemented');
    }
}