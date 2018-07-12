/*
For the hex impaired:
80   40  20  10   8   4   2   1 (hex value)
128  64  32  16   8   4   2   1 (decimal value)
8    7   6   5    4   3   2   1 (bit position)
*/
// https://en.wikipedia.org/wiki/LEB128
const readVarUint = (dataView, offset) => {
    let [val, count, byte] = [0, 0, 0];
    do {
        byte = dataView.getUint8(offset + count);
        val |= (byte & 0x7F) << (count++ * 7);
    } while(byte & 0x80);
    return [val, count];
}

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

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#elem_type
const parseElemType = (dataView, offset) => {
    const [type, _1] = readType(dataView, offset);
    if(typeConstructors[type] !== 'anyfunc') {
        throw new Error('Illegal type: ', type);
    }
    return [type, _1];
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#resizable_limits
const parseResizableLimits = (dataView, original) => {
    let offset = original;
    const [flags, _1] = readVarUint(dataView, offset);
    offset += _1;
    const [initial, _2] = readVarUint(dataView, offset);
    offset += _2;
    const resizableLimits = {
        initial
    }
    if(flags === 1) {
        const [maximum, _3] = readVarUint(dataView, offset);
        resizableLimits.maximum = maximum;
        offset += _3;
    }
    return [resizableLimits, offset - original];
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table_type
const parseTableType = (dataView, offset) => {
    const [elemType, _1] = parseElemType(dataView, offset);
    const [resizableLimits, _2] = parseResizableLimits(dataView, offset + _1);
    return [resizableLimits, _1 + _2];
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#table-section
const parseTableSection = (dataView, offset) => {
    const [count, countLen] = readVarUint(dataView, offset);
    offset += countLen;
    const table = {
        type: 'Table',
        limits: []
    }
    for(let i = 0; i < count; i++) {
        const [resizableLimits, _2] = parseTableType(dataView, offset);
        offset += _2;
        table.limits.push(resizableLimits);
    }
    return table;
}

const parseMemorySection = (dataView, offset) => {
    const [resizableLimits, _1] = parseResizableLimits(dataView, offset);
    return {
        type: 'Memory',
        limits: resizableLimits
    };
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global_type
const parseGlobalType = (dataView, offset) => {
    const [contentType, _1] = readType(dataView, offset);
    const [mutability, _2] = readVarUint(dataView, offset + _1);
    const globalVar = {contentType, mutable: mutability === 1};
    return [globalVar, _1 + _2];
}

const parseInitExpr = (dataView, offset) => {
    throw new Error('TODO');
}

// https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#global-section
const parseGlobalSection = (dataView, offset) => {
    const [count, countLen] = readVarUint(dataView, offset);
    offset += countLen;
    const section = {
        type: 'Global',
        globalVariables: []
    }
    for(let i = 0; i < count; i++) {
        const [globalType, _2] = parseGlobalType(dataView, offset);
        offset += _2;
        const [initExpr, _3] = parseInitExpr(dataView, offset);
        offset += _3;
        const globalVariable = {globalType, initExpr};
        section.globalVariables.push(globalVariable);
    }
    return section;
}

class WasmParser {
    constructor(textDecoder) {
        this.textDecoder = textDecoder;
    }

    parse(dataView) {
        const magicNumber = dataView.getUint32(0, true);
        if(magicNumber !== 0x6d736100) {
            throw new Error('Invalid preamble!');
        }
        const version = dataView.getUint32(4, true);
        console.log('wasm version=', version);
        const sections = this.parseSections(dataView, 8);
        return {
            type: 'module',
            version: version,
            sections
        };
    }

    parseSections(dataView, offset) {
        const sections = [];
        while(offset < dataView.byteLength) {
            const id = dataView.getUint8(offset++);
            const type = sectionTypes[id];
            const [payloadLen, lenLen] = readVarUint(dataView, offset);
            console.log(`section=${type} position=${offset}`);
    
            offset += lenLen;
            let section;
            switch(type) { // TODO: map instead of switch
                case 'Type': 
                    section = parseTypeSection(dataView, offset);
                    break;
                case 'Function':
                    section = parseFunctionSection(dataView, offset);
                    break;
                case 'Table':
                    section = parseTableSection(dataView, offset);
                    break;
                case 'Memory':
                    section = parseMemorySection(dataView, offset);
                    break;
                case 'Global':
                    section = parseGlobalSection(dataView, offset);
                    break;
                case 'Export':
                    section = this.parseExportSection(dataView, offset);
                    break;
                default:
                    throw new Error('Invalid type: ' + type);
            }
            sections.push(section);
    
            offset += payloadLen;
        }
        return sections;
    }

    parseExportEntry(dataView, offset) {
        const [fieldLen, _1] = readVarUint(dataView, offset);
        offset += _1;
        const bytes = dataView.buffer.slice(offset, offset + fieldLen);
        const fieldStr = this.textDecoder.decode(bytes);
        offset += fieldLen;
        const kindId = dataView.getUint8(offset);
        const kind = externalKind[kindId];
        offset += 1;
        const [index, _2] = readVarUint(dataView, offset);
        const exportEntry = {
            field: fieldStr,
            kind,
            index
        };
        return [exportEntry, _1 + fieldLen + _2 + 1];
    }    

    parseExportSection(dataView, offset) {
        const [count, _1] = readVarUint(dataView, offset);
        offset += _1;
        const section = {
            type: 'Export',
            exports: []
        }
        for(let i = 0; i < count; i++) {
            const [exportEntry, _2] = this.parseExportEntry(dataView, offset);
            offset += _2;
            section.exports.push(exportEntry);
        }
        return section;
    }    
}
export default WasmParser;