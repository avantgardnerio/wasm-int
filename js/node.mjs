import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';

import WasmParser from './parser/WasmParser.mjs';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const file = await readFile('test.wasm');
        const parser = new WasmParser(file.buffer, TextDecoder);
        const module = parser.parse();
        console.log(module);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();