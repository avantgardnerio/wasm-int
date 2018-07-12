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
        const [payloadLen, lenLen] = readVarUint(dataView, offset);
        console.log(`section=${sectionTypes[id]} position=${offset}`);

        const section = {
            type: sectionTypes[id],
            position: offset
        }
        sections.push(section);

        offset += lenLen + payloadLen;
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