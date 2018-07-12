export default class Reader {
    constructor(buffer) {
        this.buffer = buffer;
        this.dataView = new DataView(buffer);
        this.offset = 0;
    }

    getUint32() {
        const val = this.dataView.getUint32(this.offset, true);
        this.offset += 4;
        return val;
    }
}