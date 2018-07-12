import Reader from '../stream/Reader.mjs';

// TODO: kill
const readVarUint = (dataView, offset) => {
    let [val, count, byte] = [0, 0, 0];
    do {
        byte = dataView.getUint8(offset + count);
        val |= (byte & 0x7F) << (count++ * 7);
    } while(byte & 0x80);
    return [val, count];
}

// TODO: kill
const readVarInt = (dataView, offset) => {
    let [val, count, byte, mask] = [0, 0, 0, 0];
    do {
        byte = dataView.getUint8(offset + count);
        const lastByte = !(byte & 0x80);
        const negative = lastByte && !!(byte & 0x40);
        const significant = lastByte ? 0x3F : 0x7F;
        mask |= (0xFF & significant) << (count * 7); 
        val |= (byte & significant) << (count * 7);
        if(negative) {
            val = (((val ^ mask) & mask) + 1) * -1;
        }
        count++;
    } while(byte & 0x80);
    return [val, count];
}

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

const typeConstructors = {
    "-1": "i32", // -0x01 (i.e., the byte 0x7f)	i32
    "-2": "i64", // -0x02 (i.e., the byte 0x7e)	i64
    "-3": "f32", // -0x03 (i.e., the byte 0x7d)	f32
    "-4": "f64", // -0x04 (i.e., the byte 0x7c)	f64
    "-16": "anyfunc", // -0x10 (i.e., the byte 0x70)	anyfunc
    "-32": "func", // -0x20 (i.e., the byte 0x60)	func
    "-64": "block_type" // -0x40 (i.e., the byte 0x40)	pseudo type for representing an empty block_type
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#external_kind
const externalKind = {
    "0": "Function",
    "1": "Table",
    "2": "Memory",
    "3": "Global"
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#language-types
const readType = (dataView, offset) => {
    const [type, len] = readVarInt(dataView, offset);
    if(!typeConstructors[type]) {
        throw new Error('Invalid type: ', type);
    }
    return [type, len];
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#func_type
const parseFuncType = (dataView, original) => {
    let offset = original; // TODO: Fix this horrible pattern
    const [form, _1] = readType(dataView, offset);
    offset += _1;
    const [paramCount, _2] = readVarUint(dataView, offset);
    offset += _2;
    const func = {
        type: 'function',
        returnType: typeConstructors[form],
        parameterTypes: [],
        returnTypes: []
    };
    for(let i = 0; i < paramCount; i++) {
        const [paramType, _3] = readType(dataView, offset);
        offset += _3;
        func.parameterTypes.push(typeConstructors[paramType]);
    }
    const [returnCount, _4] = readVarUint(dataView, offset);
    offset += _4;
    for(let i = 0; i < returnCount; i++) {
        const [returnType, _5] = readType(dataView, offset);
        offset += _5;
        func.returnTypes.push(typeConstructors[returnType]);
    }
    const ret = returnCount === 1 ? func.returnTypes[0] : 'void';
    const p = func.parameterTypes.join(', ');
    console.log(`${ret} xxx(${p})`);
    return [func, offset - original];
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#type-section
const parseTypeSection = (dataView, offset) => { // Function signature declarations
    const [count, countLen] = readVarUint(dataView, offset);
    offset += countLen;
    const functionSignatures = [];
    for(let i = 0; i < count; i++) {
        const [func, _1] = parseFuncType(dataView, offset);
        offset += _1;
        functionSignatures.push(func);
    }
    return {
        type: 'Types',
        functionSignatures
    };
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#function-section
const parseFunctionSection = (dataView, offset) => {
    const [count, countLen] = readVarUint(dataView, offset);
    offset += countLen;
    const functionSignatureIndices = [];
    for(let i = 0; i < count; i++) {
        const [sig, _1] = readVarUint(dataView, offset);
        offset += _1;
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
                section = parseTypeSection(dataView, reader.offset);
                break;
            case 'Function':
                section = parseFunctionSection(dataView, reader.offset);
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