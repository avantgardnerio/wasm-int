import WasmParser from './parser/WasmParser.mjs';

const createUi = () => {
    const textArea = document.createElement('textarea');
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('value', 'Load wasm file...');
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        const fr = new FileReader();
        fr.onload = (e) => {
            const buffer = e.target.result;
            const parser = new WasmParser(buffer, TextDecoder);
            const module = parser.parse();
            textArea.value = JSON.stringify(module, undefined, 2);
            console.log(module);
        }
        fr.readAsArrayBuffer(file);
    }
    document.body.appendChild(fileInput);
    document.body.appendChild(textArea);

    return textArea;
}

onload = async () => {
    const textArea = createUi();

    const buffer = await (await fetch('test.wasm')).arrayBuffer();
    const parser = new WasmParser(buffer, TextDecoder);
    const module = parser.parse();
    textArea.value = JSON.stringify(module, undefined, 2);
    console.log(module);
}