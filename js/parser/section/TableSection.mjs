import Section from "./Section.mjs";

export default class TableSection extends Section {
    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table-section
    parse() {
        const count = this.reader.readVarUint();
        const table = {
            type: 'Table',
            limits: []
        }
        for(let i = 0; i < count; i++) {
            const tableType = this.parseTableType();
            table.limits.push(tableType);
        }
        return table;
    }

    // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table_type
     parseTableType() {
        const type = this.reader.readVarInt();
        const resizableLimits = this.parseResizableLimits();
        return {type, resizableLimits};
    }

    static get type() {
        return 4;
    }
}