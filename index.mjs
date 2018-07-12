import fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

const main = async() => {
    try {
        // https://github.com/WebAssembly/design/blob/master/BinaryEncoding.md#high-level-structure
        const file = await readFile('test.wasm');
        const header = new DataView(file.buffer);
        const magicNumber = header.getUint32(0, true);
        if(magicNumber !== 0x6d736100) throw new Error('Invalid header!');
        const version = header.getUint32(4, true);
        console.log('wasm version=', version);
    } catch(ex) {
        console.error('Error reading wasm!', ex);
    }
}

main();