import Section from './Section.mjs';

export default class MemorySection extends Section {
    parse() {
        const resizableLimits = this.parseResizableLimits();
        return {
            type: 'Memory',
            limits: resizableLimits
        };
    }
        
    static get type() {
        return 5;
    }
}