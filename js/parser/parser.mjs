import Reader from '../stream/Reader.mjs';

import FuncSigSection from './section/FuncSigSection.mjs';
import FunctionSection from './section/FunctionSection.mjs';
import TableSection from './section/TableSection.mjs';
import MemorySection from './section/MemorySection.mjs';
import GlobalSection from './section/GlobalSection.mjs';
import ExportSection from './section/ExportSection.mjs';
import CodeSection from './section/CodeSection.mjs';

const parsers = [
    FuncSigSection, 
    FunctionSection,
    TableSection,
    MemorySection,
    GlobalSection,
    ExportSection,
    CodeSection
];

const parseSections = (reader) => {
    const dataView = reader.dataView; // TODO: kill this

    const sections = [];
    while(reader.available) {
        const type = reader.getUint8();
        const payloadLen = reader.readVarUint();
        const position = reader.offset;
        console.log(`section=${type} position=${position}`);

        const Parser = parsers.find(s => s.type === type);
        if(!Parser) {
            throw new Error('Invalid type: ' + type);
        }
        const parser = new Parser(reader);
        const section = parser.parse();
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