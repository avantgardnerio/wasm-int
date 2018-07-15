import { access } from "fs";

const denormalize = (module) => {
    const exports = module.sections.filter(s => s.type === 'Export');
    const funcIdxs = module.sections.filter(s => s.type === 'Function');
    const bodies = module.sections.filter(s => s.type === 'Code');
    const types = module.sections.filter(s => s.type === 'Types');
    const imports = module.sections.filter(s => s.type === 'Import');
    const globals = module.sections.filter(s => s.type === 'Global');

    if(exports.length !== 1) throw new Error('Expected 1 Export section!');
    if(funcIdxs.length !== 1) throw new Error('Expected 1 Function section!');
    if(bodies.length !== 1) throw new Error('Expected 1 Code section!');
    if(types.length !== 1) throw new Error('Expected 1 Types section!');
    if(imports.length !== 1) throw new Error('Expected 1 Import section!');
    if(globals.length !== 1) throw new Error('Expected 1 Global section!');

    if(bodies.length !== funcIdxs.length) throw new Error('Expected 1 body per function!');

    const importedFunctions = imports[0].imports
        .filter(i => i.kind === 'Function');
    const importedGlobals = imports[0].imports
        .filter(i => i.kind === 'Global');
    
    const globalVariables = globals[0].globalVariables;

    // https://github.com/WebAssembly/design/blob/master/Modules.md#function-index-space
    // the index space starts at zero with the function imports (if any) 
    // followed by the functions defined within the module.
    const exportedFunctions = exports[0].exports
        .filter(e => e.kind === 'Function')
        .map(f => {
            const realIdx = f.index - importedFunctions.length;
            const sigIdx = funcIdxs[0].functionSignatureIndices[realIdx];
            return {
                name: f.field,
                body: bodies[0].functions[realIdx],
                signature: types[0].functionSignatures[sigIdx]
            }
        }).reduce((acc, cur) => ({...acc, [cur.name]: cur}), {});

    const result = {
        imports: {
            globals: importedGlobals,
            functions: importedFunctions
        },
        exports: {
            functions: exportedFunctions
        },
        globals: globalVariables
    };

    return result;
}

export default denormalize;