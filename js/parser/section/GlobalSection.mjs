import Section from './Section.mjs';

export default class GlobalSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global-section
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Global',
            globalVariables: []
        }
        for(let i = 0; i < count; i++) {
            const globalType = this.parseGlobalType();
            const initExpr = this.parseInitExpr();
            const globalVariable = {globalType, initExpr};
            section.globalVariables.push(globalVariable);
        }
        return section;
    }

    parseInitExpr() {
        throw new Error('TODO');
    }    

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global_type
    parseGlobalType() {
        const contentType = this.reader.readVarInt();
        const mutability = this.reader.readVarUint();
        const globalVar = {contentType, mutable: mutability === 1};
        return globalVar;
    }

    static get type() {
        return 6;
    }
}