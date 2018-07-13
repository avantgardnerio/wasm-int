import Section from './Section.mjs';

export default class CodeSection extends Section {

    parse() {
        throw new Error('TODO');
    }

    static get type() {
        return 10;
    }
}