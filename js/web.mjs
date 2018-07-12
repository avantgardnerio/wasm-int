import createParser from './parser/parser.mjs';

onload = async () => {
    const buffer = await (await fetch('test.wasm')).arrayBuffer();
    const parse = createParser(TextDecoder);
    const module = parse(buffer);
    console.log(module);
}