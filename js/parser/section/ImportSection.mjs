import Section from './Section.mjs';

export default class ImportSection extends Section {
    parse() {
        const count = this.reader.readVarUint();
        const section = {
            type: 'Import',
            imports: []
        }
        for (let i = 0; i < count; i++) {
            const importEntry = this.parseImportEntry();
            section.imports.push(importEntry);
        }
        return section;
    }

    parseImportEntry() {
        const moduleLen = this.reader.readVarUint();
        const module = this.reader.readString(moduleLen);

        const fieldLen = this.reader.readVarUint();
        const field = this.reader.readString(fieldLen);

        const kindId = this.reader.getUint8();
        const kind = this.externalKind[kindId];
        let type;
        switch (kind) {
            case 'Memory':
                type = this.parseResizableLimits();
                break;
            case 'Table':
                type = this.parseTableType();
                break;
            case 'Global':
                type = this.parseGlobalType();
                return { module, field, kind, type: type.type, mutable: type.mutable };
            case 'Function':
                // the index of the function signature
                type = this.reader.readVarUint();
                break;
            default:
                throw new Error('Invalid kind: ' + kind);
        }

        const entry = { module, field, kind, type };
        return entry;
    }

    static get type() {
        return 2;
    }
}