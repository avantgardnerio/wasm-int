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

export default class WasmParser {
    constructor(buffer, TextDecoder) {
        this.buffer = buffer;
        this.reader = new Reader(buffer, TextDecoder);
    }

    parse() {
        const magicNumber = this.reader.getUint32();
        if(magicNumber !== 0x6d736100) {
            throw new Error('Invalid preamble!');
        }
        const version = this.reader.getUint32();
        console.log('wasm version=', version);
        const sections = this.parseSections();
        return {
            type: 'module',
            version: version,
            sections
        };
    }

    parseSections() {
        const sections = [];
        while(this.reader.available) {
            const type = this.reader.getUint8();
            const payloadLen = this.reader.readVarUint();
            const position = this.reader.offset;
            console.log(`section=${type} position=${position}`);
    
            const Parser = parsers.find(s => s.type === type);
            if(!Parser) {
                throw new Error('Invalid type: ' + type);
            }
            const parser = new Parser(this.reader);
            const section = parser.parse();
            sections.push(section);
    
            this.reader.offset = position + payloadLen;
        }
        return sections;
    }    
}
