import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';

import WasmParser from './parser.mjs';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const file = await readFile('test.wasm');
        const dataView = new DataView(file.buffer);
        const decoder = new TextDecoder("utf-8");
        const parser = new WasmParser(decoder);
        const module = parser.parse(dataView);
        console.log(module);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();