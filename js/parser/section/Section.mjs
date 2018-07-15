import Decoder from '../../decode/Decoder.mjs';

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
        this.typeConstructors = {
            "-1": "i32", // -0x01 (i.e., the byte 0x7f)	i32
            "-2": "i64", // -0x02 (i.e., the byte 0x7e)	i64
            "-3": "f32", // -0x03 (i.e., the byte 0x7d)	f32
            "-4": "f64", // -0x04 (i.e., the byte 0x7c)	f64
            "-16": "anyfunc", // -0x10 (i.e., the byte 0x70)	anyfunc
            "-32": "func", // -0x20 (i.e., the byte 0x60)	func
            "-64": "block_type" // -0x40 (i.e., the byte 0x40)	pseudo type for representing an empty block_type
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
        const contentType = this.typeConstructors[this.reader.readVarInt()];
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

    parseInitExpr() {
        const opcodes = new Decoder(this.reader).decode();
        return opcodes;
    }    

    parse() {
        throw new Error('Not implemented');
    }

    static get type() {
        throw new Error('Not implemented');
    }
}