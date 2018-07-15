import Section from './Section.mjs';
import Decoder from '../../decode/Decoder.mjs';
import { access } from 'fs';

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
            .map(() => this.readLocalEntry())
            .reduce((a, c) => [...a, ...Array(c.count).fill(c.type)], []);
        const code = new Decoder(this.reader).decode();
        return { localVariables, code };
    }

    readLocalEntry() {
        const count = this.reader.readVarUint();
        const type = this.typeConstructors[this.reader.readVarInt()];
        return { type, count };
    }

    static get type() {
        return 10;
    }
}