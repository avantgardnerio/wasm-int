import parseWasm from './parser.mjs';

onload = async () => {
    const buffer = await (await fetch('test.wasm')).arrayBuffer();
    const dataView = new DataView(buffer);
    const module = parseWasm(dataView);
    console.log(module);
}