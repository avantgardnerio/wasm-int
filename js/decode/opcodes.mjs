import variables from './variables/index.mjs';
import constants from './constants/index.mjs';
import numeric from './numeric/index.mjs';
import flow from './flow/index.mjs';
import call from './call/index.mjs';
import comparison from './comparison/index.mjs';

export default [
    ...variables,
    ...constants,
    ...numeric,
    ...flow,
    ...call,
    ...comparison
];