import Section from './Section.mjs';

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
            returnType: this.typeConstructors[form],
            parameterTypes: [],
            returnTypes: []
        };
        for(let i = 0; i < paramCount; i++) {
            const paramType = this.reader.readVarInt();
            func.parameterTypes.push(this.typeConstructors[paramType]);
        }
        const returnCount = this.reader.readVarUint();
        for(let i = 0; i < returnCount; i++) {
            const returnType = this.reader.readVarInt();
            func.returnTypes.push(this.typeConstructors[returnType]);
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