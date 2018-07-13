import Reader from '../stream/Reader.mjs';

import FuncSigSection from './section/FuncSigSection.mjs';

const sectionTypes = {
    "0": "Custom",
    "1": "Type", // Function signature declarations
    "2": "Import", // Import declarations
    "3": "Function", // Function declarations
    "4": "Table", // Indirect function table and other tables
    "5": "Memory", // Memory attributes
    "6": "Global", // Global declarations
    "7": "Export", // Exports
    "8": "Start", // Start function declaration
    "9": "Element", // Elements section
    "10": "Code", // Function bodies (code)
    "11": "Data" // Data segments
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#external_kind
const externalKind = {
    "0": "Function",
    "1": "Table",
    "2": "Memory",
    "3": "Global"
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#function-section
const parseFunctionSection = (reader) => {
    const count = reader.readVarUint();
    const functionSignatureIndices = [];
    for(let i = 0; i < count; i++) {
        const sig = reader.readVarUint();
        functionSignatureIndices.push(sig);
    }
    return {
        type: 'Function',
        functionSignatureIndices
    };
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#resizable_limits
const parseResizableLimits = (reader) => {
    const flags = reader.readVarUint();
    const initial = reader.readVarUint();
    const resizableLimits = {initial};
    if(flags === 1) {
        resizableLimits.maximum = reader.readVarUint();
    }
    return resizableLimits;
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table_type
const parseTableType = (reader) => {
    const type = reader.readVarInt();
    const resizableLimits = parseResizableLimits(reader);
    return {type, resizableLimits};
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table-section
const parseTableSection = (reader) => {
    const count = reader.readVarUint();
    const table = {
        type: 'Table',
        limits: []
    }
    for(let i = 0; i < count; i++) {
        const tableType = parseTableType(reader);
        table.limits.push(tableType);
    }
    return table;
}

const parseMemorySection = (reader) => {
    const resizableLimits = parseResizableLimits(reader);
    return {
        type: 'Memory',
        limits: resizableLimits
    };
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global_type
const parseGlobalType = (reader) => {
    const contentType = reader.readVarInt();
    const mutability = reader.readVarUint();
    const globalVar = {contentType, mutable: mutability === 1};
    return globalVar;
}

const parseInitExpr = (reader) => {
    throw new Error('TODO');
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global-section
const parseGlobalSection = (reader) => {
    const count = reader.readVarUint();
    const section = {
        type: 'Global',
        globalVariables: []
    }
    for(let i = 0; i < count; i++) {
        const globalType = parseGlobalType(reader);
        const initExpr = parseInitExpr(reader);
        const globalVariable = {globalType, initExpr};
        section.globalVariables.push(globalVariable);
    }
    return section;
}

const parseExportEntry = (reader) => {
    const fieldLen = reader.readVarUint();
    const field = reader.readString(fieldLen);
    const kindId = reader.getUint8();
    const kind = externalKind[kindId];
    const index = reader.readVarUint();
    const exportEntry = {field, kind, index};
    return exportEntry;
}      

const parseExportSection = (reader) => {
    const count = reader.readVarUint();
    const section = {
        type: 'Export',
        exports: []
    }
    for(let i = 0; i < count; i++) {
        const exportEntry = parseExportEntry(reader);
        section.exports.push(exportEntry);
    }
    return section;
}        

const parseSections = (reader) => {
    const dataView = reader.dataView; // TODO: kill this

    const sections = [];
    while(reader.available) {
        const id = reader.getUint8();
        const type = sectionTypes[id];
        const payloadLen = reader.readVarUint();
        const position = reader.offset;
        console.log(`section=${type} position=${position}`);

        let section;
        switch(type) { // TODO: map instead of switch
            case 'Type': 
                section = new FuncSigSection().parse(reader);
                break;
            case 'Function':
                section = parseFunctionSection(reader);
                break;
            case 'Table':
                section = parseTableSection(reader);
                break;
            case 'Memory':
                section = parseMemorySection(reader);
                break;
            case 'Global':
                section = parseGlobalSection(reader);
                break;
            case 'Export':
                section = parseExportSection(reader);
                break;
            default:
                throw new Error('Invalid type: ' + type);
        }
        sections.push(section);

        reader.offset = position + payloadLen;
    }
    return sections;
}    

const createParser = (TextDecoder) => {
    const parse = (buffer) => {
        const reader = new Reader(buffer, TextDecoder);

        const magicNumber = reader.getUint32();
        if(magicNumber !== 0x6d736100) {
            throw new Error('Invalid preamble!');
        }
        const version = reader.getUint32();
        console.log('wasm version=', version);
        const sections = parseSections(reader);
        return {
            type: 'module',
            version: version,
            sections
        };
    }
    return parse;
}

export default createParser;