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
            const start = new Date().getTime();
            const filename = 'math';
            const cmd = `emcc src/test/c/${filename}.c -O0 -s ONLY_MY_CODE=1 -s SIDE_MODULE=1 -o ${filename}.wasm`;
            console.log(`\n----- running: ${cmd}`);
            execSync(cmd);
            const compiled = new Date().getTime();
            console.log(`\n----- compiled in ${compiled - start}ms`);
    
            const file = await readFile('math.wasm');
            const parser = new WasmParser(file.buffer, TextDecoder);
            const module = parser.parse();
            interpreter = new WasmInterpreter(module);
            console.log(`\n----- parsed wasm in ${new Date().getTime() - compiled}ms`);
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

    jasmine.env.it('should divide int32s', async () => {
        const result = interpreter.invoke('_i32div_s', 1, 2);
        expect(result).toEqual(0);
    })
})
