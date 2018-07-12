import fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const magicNumber = '\0asm'; 
        const file = await readFile('test.wasm');
        const header = file.slice(0, magicNumber.length);
        if(!header.every((v, i) => v === magicNumber.charCodeAt(i))) throw new Error('Invalid header!');
        console.log('hello world', file);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();