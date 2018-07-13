import Section from './Section.mjs';

export default class MemorySection extends Section {
    parse(reader) {
        const resizableLimits = this.parseResizableLimits(reader);
        return {
            type: 'Memory',
            limits: resizableLimits
        };
    }
        
    static get type() {
        return 5;
    }
}