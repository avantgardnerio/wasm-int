import jasmine from './jasmine.mjs';
import fs from 'fs';
import {TextDecoder} from 'util';
import {promisify} from 'util';
import { execSync } from 'child_process';

import WasmParser from './parser/WasmParser.mjs';
import WasmInterpreter from './interpreter/WasmInterpreter.mjs';

jasmine.env.describe('WasmParser', () => {
    let interpreter;

    jasmine.env.beforeAll(() => {
        const start = new Date().getTime();
        const filename = 'math';
        // -s SIDE_MODULE=1
        const cmd = `emcc src/test/c/${filename}.c -O0 -s ONLY_MY_CODE=1 -s LINKABLE=1 -s EXPORT_ALL=1 -o ${filename}.html`;
        console.log(`\n----- running: ${cmd}`);
        execSync(cmd);
        const compiled = new Date().getTime();
        console.log(`\n----- compiled in ${compiled - start}ms`);

        const file = fs.readFileSync('math.wasm');
        const ar = new Uint8Array(file);
        const parser = new WasmParser(ar.buffer, TextDecoder);
        const module = parser.parse();
        interpreter = new WasmInterpreter(module);
        console.log(`\n----- parsed wasm in ${new Date().getTime() - compiled}ms`);
    });

    jasmine.env.xit('should loop and break', () => {
        const result = interpreter.invoke('_pow', 3, 3);
        expect(result).toEqual(27);
    });

    jasmine.env.it('should handle recursive function calls', () => {
        const result = interpreter.invoke('_fib', 6);
        expect(result).toEqual(8);
    });

    jasmine.env.xit('should add int32s', () => {
        const result = interpreter.invoke('_i32add', 3, 5);
        expect(result).toEqual(8);
    });

    jasmine.env.xit('should subtract int32s', () => {
        const result = interpreter.invoke('_i32sub', 11, 7);
        expect(result).toEqual(4);
    });

    jasmine.env.xit('should multiply int32s', () => {
        const result = interpreter.invoke('_i32mul', 3, 4);
        expect(result).toEqual(12);
    });

    jasmine.env.xit('should divide int32s', () => {
        const result = interpreter.invoke('_i32div_s', 1, 2);
        expect(result).toEqual(0);
    });

    jasmine.env.xit('should divide int32u', () => {
        const result = interpreter.invoke('_i32div_u', 5, 2);
        expect(result).toEqual(2);
    });

    jasmine.env.xit('should or int32u', () => {
        const result = interpreter.invoke('_i32or', 1, 2);
        expect(result).toEqual(3);
    });

    jasmine.env.xit('should xor int32u', () => {
        const result = interpreter.invoke('_i32xor', 6, 3);
        expect(result).toEqual(5);
    });

    jasmine.env.xit('should shift left int32', () => {
        const result = interpreter.invoke('_i32shl', 1, 2);
        expect(result).toEqual(4);
    });

    jasmine.env.xit('should eq int32', () => {
        expect(interpreter.invoke('_i32eq', 1, 2)).toEqual(0);
        expect(interpreter.invoke('_i32eq', 1, 1)).toEqual(1);
    });

    jasmine.env.xit('should ne int32', () => {
        expect(interpreter.invoke('_i32ne', 1, 2)).toEqual(1);
        expect(interpreter.invoke('_i32ne', 1, 1)).toEqual(0);
    });

    jasmine.env.xit('should lt int32', () => {
        expect(interpreter.invoke('_i32lt_s', 1, 2)).toEqual(1);
        expect(interpreter.invoke('_i32lt_s', 1, 1)).toEqual(0);
    });

    jasmine.env.xit('should lt int32_u', () => {
        expect(interpreter.invoke('_i32lt_u', 1, 2)).toEqual(1);
        expect(interpreter.invoke('_i32lt_u', 1, 1)).toEqual(0);
    });

    jasmine.env.xit('should gt int32_s', () => {
        expect(interpreter.invoke('_i32gt_s', 2, 1)).toEqual(1);
        expect(interpreter.invoke('_i32gt_s', 1, 1)).toEqual(0);
    });

    jasmine.env.xit('should gt int32_u', () => {
        expect(interpreter.invoke('_i32gt_u', 2, 1)).toEqual(1);
        expect(interpreter.invoke('_i32gt_u', 1, 1)).toEqual(0);
    });

    jasmine.env.xit('should le int32_s', () => {
        expect(interpreter.invoke('_i32le_s', 1, 2)).toEqual(1);
        expect(interpreter.invoke('_i32le_s', 1, 1)).toEqual(1);
        expect(interpreter.invoke('_i32le_s', 1, 0)).toEqual(0);
    });

    jasmine.env.xit('should le int32_u', () => {
        expect(interpreter.invoke('_i32le_u', 1, 2)).toEqual(1);
        expect(interpreter.invoke('_i32le_u', 1, 1)).toEqual(1);
        expect(interpreter.invoke('_i32le_u', 1, 0)).toEqual(0);
    });

    jasmine.env.xit('should ge int32_s', () => {
        expect(interpreter.invoke('_i32ge_s', 2, 1)).toEqual(1);
        expect(interpreter.invoke('_i32ge_s', 1, 1)).toEqual(1);
        expect(interpreter.invoke('_i32ge_s', 0, 1)).toEqual(0);
    });

    jasmine.env.xit('should ge int32_u', () => {
        expect(interpreter.invoke('_i32ge_u', 2, 1)).toEqual(1);
        expect(interpreter.invoke('_i32ge_u', 1, 1)).toEqual(1);
        expect(interpreter.invoke('_i32ge_u', 0, 1)).toEqual(0);
    });

});
