import jasmine from './jasmine.mjs';
import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';
import { execSync } from 'child_process';

import WasmParser from './parser/WasmParser.mjs';
import WasmInterpreter from './interpreter/WasmInterpreter.mjs';

const readFile = promisify(fs.readFile);

jasmine.env.describe('WasmParser', () => {
    let interpreter;

    jasmine.env.beforeAll(async () => {
        try {
            const filename = 'math';
            const cmd = `emcc src/test/c/${filename}.c -O0 -s ONLY_MY_CODE=1 -s SIDE_MODULE=1 -o ${filename}.wasm`;
            console.log('----- running: ' + cmd);
            execSync(cmd);
            console.log('----- complete!');
    
            const file = await readFile('math.wasm');
            const parser = new WasmParser(file.buffer, TextDecoder);
            const module = parser.parse();
            interpreter = new WasmInterpreter(module);
        } catch(ex) {
            console.error(ex);
            jasmine.env.fail(ex);
        }
    });

    jasmine.env.it('should add int32s', async () => {
        const result = interpreter.invoke('_i32add', 3, 5);
        expect(result).toEqual(8);
    })

    jasmine.env.it('should subtract int32s', async () => {
        const result = interpreter.invoke('_i32sub', 11, 7);
        expect(result).toEqual(4);
    })

    jasmine.env.it('should multiply int32s', async () => {
        const result = interpreter.invoke('_i32mul', 3, 4);
        expect(result).toEqual(12);
    })
})
