import Section from "./Section.mjs";

export default class ElementSection extends Section {
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Element',
            elements: []
        }
        for (let i = 0; i < count; i++) {
            const segment = this.parseElemSegment();
            section.elements.push(segment);
        }
        return section;
    }

    parseElemSegment() {
        const index = this.reader.readVarUint(); // table index (0 in the MVP)
        const offset = this.parseInitExpr(); // the offset at which to place the elements
        const numElem = this.reader.readVarUint();
        const elems = [];
        for (let i = 0; i < numElem; i++) {
            const elem = this.reader.readVarUint();
            elems.push(elem);
        }
        return { index, offset, numElem, elems };
    }

    static get type() {
        return 9;
    }
}