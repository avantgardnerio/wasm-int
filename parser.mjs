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

/*
    id	            varuint7	section code
    payload_len	    varuint32	size of this section in bytes
    name_len	    varuint32 ?	length of name in bytes, present if id == 0
    name	        bytes ?	section name: valid UTF-8 byte sequence, present if id == 0
    payload_data	bytes	content of this section, of length payload_len - sizeof(name) - sizeof(name_len)
*/
const parseSections = (dataView, offset) => {
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
            default:
                throw new Error('Invalid type: ' + type);
        }
        sections.push(section);

        offset += payloadLen;
    }
    return sections;
}

const parseWasm = (dataView) => {
    const magicNumber = dataView.getUint32(0, true);
    if(magicNumber !== 0x6d736100) {
        throw new Error('Invalid preamble!');
    }
    const version = dataView.getUint32(4, true);
    console.log('wasm version=', version);
    const sections = parseSections(dataView, 8);
    return {
        type: 'module',
        version: version,
        sections
    };
}

export default parseWasm;