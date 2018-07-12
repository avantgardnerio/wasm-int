import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';

import createParser from './parser/parser.mjs';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const file = await readFile('test.wasm');
        const parse = createParser(TextDecoder);
        const module = parse(file.buffer);
        console.log(module);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();