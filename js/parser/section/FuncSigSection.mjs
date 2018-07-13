import Section from './Section.mjs';

const typeConstructors = {
    "-1": "i32", // -0x01 (i.e., the byte 0x7f)	i32
    "-2": "i64", // -0x02 (i.e., the byte 0x7e)	i64
    "-3": "f32", // -0x03 (i.e., the byte 0x7d)	f32
    "-4": "f64", // -0x04 (i.e., the byte 0x7c)	f64
    "-16": "anyfunc", // -0x10 (i.e., the byte 0x70)	anyfunc
    "-32": "func", // -0x20 (i.e., the byte 0x60)	func
    "-64": "block_type" // -0x40 (i.e., the byte 0x40)	pseudo type for representing an empty block_type
}

export default class FuncSigSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#type-section
    parse() { // Function signature declarations
        const count = this.reader.readVarUint();
        const functionSignatures = [];
        for(let i = 0; i < count; i++) {
            const func = this.parseFuncType();
            functionSignatures.push(func);
        }
        return {
            type: 'Types',
            functionSignatures
        };
    }

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#func_type
    parseFuncType() {
        const form = this.reader.readVarInt();
        const paramCount = this.reader.readVarUint();
        const func = {
            type: 'function',
            returnType: typeConstructors[form],
            parameterTypes: [],
            returnTypes: []
        };
        for(let i = 0; i < paramCount; i++) {
            const paramType = this.reader.readVarInt();
            func.parameterTypes.push(typeConstructors[paramType]);
        }
        const returnCount = this.reader.readVarUint();
        for(let i = 0; i < returnCount; i++) {
            const returnType = this.reader.readVarInt();
            func.returnTypes.push(typeConstructors[returnType]);
        }
        const ret = returnCount === 1 ? func.returnTypes[0] : 'void';
        const p = func.parameterTypes.join(', ');
        console.log(`${ret} xxx(${p})`);
        return func;
    }

    static get type() {
        return 1;
    }
}