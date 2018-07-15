import { access } from "fs";

const denormalize = (module) => {
    const exports = module.sections.filter(s => s.type === 'Export');
    const funcIdxs = module.sections.filter(s => s.type === 'Function');
    const bodies = module.sections.filter(s => s.type === 'Code');
    const types = module.sections.filter(s => s.type === 'Types');

    if(exports.length !== 1) throw new Error('Expected 1 exports section!');
    if(funcIdxs.length !== 1) throw new Error('Expected 1 exports section!');
    if(bodies.length !== 1) throw new Error('Expected 1 exports section!');
    if(types.length !== 1) throw new Error('Expected 1 exports section!');

    if(bodies.length !== funcIdxs.length) throw new Error('Expected 1 body per function!');

    const exportedFunctions = exports[0].exports
        .filter(e => e.kind === 'Function')
        .map(f => {
            const sigIdx = funcIdxs[0].functionSignatureIndices[f.index];
            return {
                name: f.field,
                body: bodies[0][f.index],
                signature: types[0].functionSignatures[sigIdx]
            }
        }).reduce((acc, cur) => ({...acc, [cur.name]: cur}), {});

    const result = {
        exports: {
            functions: exportedFunctions
        }
    };

    return result;
}

export default denormalize;