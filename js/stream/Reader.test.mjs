import jasmine from '../jasmine.mjs';

import Reader from './Reader.mjs';

jasmine.env.describe('Reader', () => {
    jasmine.env.it('should read zero', () => {
        const ar = new Uint8Array([0x00]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt64();
        expect(res).toEqual({hi: 0x00, lo: 0x00});
    });
});