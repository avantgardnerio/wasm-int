import WasmParser from './parser.mjs';

onload = async () => {
    const buffer = await (await fetch('test.wasm')).arrayBuffer();
    const dataView = new DataView(buffer);
    const decoder = new TextDecoder("utf-8");
    const parser = new WasmParser(decoder);
    const module = parser.parse(dataView);
    console.log(module);
}