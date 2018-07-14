import WasmParser from './parser/WasmParser.mjs';

onload = async () => {
    const buffer = await (await fetch('test.wasm')).arrayBuffer();
    const parser = new WasmParser(buffer, TextDecoder);
    const module = parser.parse();
    console.log(module);
}