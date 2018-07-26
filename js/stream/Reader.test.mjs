import jasmine from '../jasmine.mjs';

import Reader from './Reader.mjs';

jasmine.env.describe('Reader', () => {
    jasmine.env.it('should read 32 bit zero', () => {
        const ar = new Uint8Array([0x00]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt();
        expect(res).toEqual(0x00);
    });

    jasmine.env.it('should read 64 bit zero', () => {
        const ar = new Uint8Array([0x00]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt64();
        expect(res).toEqual([0x00, 0x00]);
    });

    jasmine.env.it('should read two byte zero', () => {
        const ar = new Uint8Array([0x80, 0x00]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt64();
        expect(res).toEqual([0x00, 0x00]);
    });

    jasmine.env.it('should read 64 bit 1', () => {
        const ar = new Uint8Array([0x01]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt64();
        expect(res).toEqual([0x00, 0x01]);
    });

    jasmine.env.it('should read 2nd 64 bit byte', () => {
        const ar = new Uint8Array([0x80, 0x01]);
        const reader = new Reader(ar.buffer);
        const res = reader.readVarInt64();
        expect(res).toEqual([0x00, 0x80]);
    });
});