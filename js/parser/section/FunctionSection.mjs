import Section from './Section.mjs';

export default class FunctionSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#function-section
    parse() {
        const count = this.reader.readVarUint();
        const functionSignatureIndices = [];
        for(let i = 0; i < count; i++) {
            const sig = this.reader.readVarUint();
            functionSignatureIndices.push(sig);
        }
        return {
            type: 'Function',
            functionSignatureIndices
        };
    }

    static get type() {
        return 3;
    }
}