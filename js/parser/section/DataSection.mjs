import Section from "./Section.mjs";

export default class DataSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#data-section
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Data',
            entries: []
        };
        for (let i = 0; i < count; i++) {
            const dataEntry = this.parseDataEntry();
            section.entries.push(dataEntry);
        }
        return section;
    }

    parseDataEntry() {
        const index = this.reader.readVarUint(); // the linear memory index (0 in the MVP)
        const offset = this.parseInitExpr(); // an i32 initializer expression at which to place the data
        const size = this.reader.readVarUint(); // size of data (in bytes)
        const bytes = this.reader.readBytes(size); // sequence of size bytes
        
        return { index, offset, size, bytes };
    }

    static get type() {
        return 11;
    }
}