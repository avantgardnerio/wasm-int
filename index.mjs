import fs from 'fs';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

const main = async() => {
    const file = await readFile('test.wasm');
    console.log('hello world', file);
}

main();