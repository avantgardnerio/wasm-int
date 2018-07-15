import jasmine from './jasmine.mjs';
import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';
import { execSync } from 'child_process';

import WasmParser from './parser/WasmParser.mjs';
import WasmInterpreter from './interpreter/WasmInterpreter.mjs';

const readFile = promisify(fs.readFile);

jasmine.env.describe('WasmParser', () => {
    jasmine.env.it('should parse', async () => {
        try {
            const cmd = 'emcc src/test/c/test.c -O0 -s ONLY_MY_CODE=1 -s SIDE_MODULE=1 -o test.wasm';
            execSync(cmd);
    
            const file = await readFile('test.wasm');
            const parser = new WasmParser(file.buffer, TextDecoder);
            const module = parser.parse();
            const interpreter = new WasmInterpreter([module]);
            const result = interpreter.invoke('main', 1);
            expect(result).toEqual(2);
        } catch(ex) {
            console.error(ex);
            fail(ex);
        }
    })

    jasmine.env.xit('should compile C', () => {
        const cmd = 'emcc hello.c -O0 -s ONLY_MY_CODE=1 -s SIDE_MODULE=1 -o index.wasm';
        const stdout = execSync(cmd);
        console.log(stdout);
    })
})