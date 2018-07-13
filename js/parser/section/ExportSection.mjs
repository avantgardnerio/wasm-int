import Section from './Section.mjs';

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#external_kind
const externalKind = {
    "0": "Function",
    "1": "Table",
    "2": "Memory",
    "3": "Global"
}

export default class ExportSection extends Section {
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Export',
            exports: []
        }
        for(let i = 0; i < count; i++) {
            const exportEntry = this.parseExportEntry();
            section.exports.push(exportEntry);
        }
        return section;
    }        
        
    parseExportEntry() {
        const fieldLen = this.reader.readVarUint();
        const field = this.reader.readString(fieldLen);
        const kindId = this.reader.getUint8();
        const kind = externalKind[kindId];
        const index = this.reader.readVarUint();
        const exportEntry = {field, kind, index};
        return exportEntry;
    }      
    
    static get type() {
        return 7;
    }   
}