export default class Section {
    constructor(reader) {
        this.reader = reader;

        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#external_kind
        this.externalKind = {
            "0": "Function",
            "1": "Table",
            "2": "Memory",
            "3": "Global"
        }
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

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global_type
    parseGlobalType() {
        const contentType = this.reader.readVarInt();
        const mutability = this.reader.readVarUint();
        const globalVar = {contentType, mutable: mutability === 1};
        return globalVar;
    }    

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table_type
    parseTableType() {
        const type = this.reader.readVarInt();
        const resizableLimits = this.parseResizableLimits();
        return {type, resizableLimits};
    }

    parse() {
        throw new Error('Not implemented');
    }

    static get type() {
        throw new Error('Not implemented');
    }
}