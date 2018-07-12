import fs from 'fs';
import {promisify} from 'util';

import parseWasm from './parser.mjs';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const file = await readFile('test.wasm');
        const dataView = new DataView(file.buffer);
        const module = parseWasm(dataView);
        console.log(module);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();