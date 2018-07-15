import Section from './Section.mjs';
import Decoder from '../../decode/Decoder.mjs';

export default class GlobalSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global-section
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Global',
            globalVariables: []
        }
        for(let i = 0; i < count; i++) {
            const type = this.parseGlobalType();
            const initExpr = this.parseInitExpr();
            const globalVariable = {type: type.type, mutable: type.mutable, initExpr};
            section.globalVariables.push(globalVariable);
        }
        return section;
    }

    static get type() {
        return 6;
    }
}