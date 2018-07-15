import Section from './Section.mjs';
import Decoder from '../../decode/Decoder.mjs';

export default class CodeSection extends Section {

    parse() {
        const count = this.reader.readVarUint();
        const functions = [...Array(count).keys()]
            .map(() => this.readFunctionBody());
        return { type: 'Code', functions };
    }

    readFunctionBody() {
        const bodySize = this.reader.readVarUint();
        const localCount = this.reader.readVarUint();
        const localVariables = [...Array(localCount).keys()]
            .map(() => this.readLocalEntry());
        const code = new Decoder(this.reader).decode();
        return { localVariables, code };
    }

    readLocalEntry() {
        const count = this.reader.readVarUint();
        const types = [...Array(count).keys()]
            .map(() => this.reader.readVarInt());
        return { types };
    }

    static get type() {
        return 10;
    }
}