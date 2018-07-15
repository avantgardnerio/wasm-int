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
        const filename = 'math';
        const cmd = `emcc src/test/c/${filename}.c -O0 -s ONLY_MY_CODE=1 -s SIDE_MODULE=1 -o ${filename}.wasm`;
        execSync(cmd);

        const file = await readFile('math.wasm');
        const parser = new WasmParser(file.buffer, TextDecoder);
        const module = parser.parse();
        interpreter = new WasmInterpreter(module);
    });

    jasmine.env.it('should add int32s', async () => {
        const result = interpreter.invoke('_addInt32s', 3, 5);
        expect(result).toEqual(8);
    })

    jasmine.env.it('should subtract int32s', async () => {
        const result = interpreter.invoke('_subInt32s', 11, 7);
        expect(result).toEqual(4);
    })

})
