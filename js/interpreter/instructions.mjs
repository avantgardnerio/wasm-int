/*
    i = instruction,
    s = stack,
    l = locals,
    g = globals
*/
export default {
    'get_local': (i, s, l, g) => s.push(l[i.localIndex]),
    'set_local': (i, s, l, g) => l[i.localIndex] = s.pop(),
    'get_global': (i, s, l, g) => s.push(l[i.globalIndex]),
    'set_global': (i, s, l, g) => g[i.globalIndex] = s.pop(),
    'i32.const': (i, s, l, g) => s.push(i.value),
    'f32.const': (i, s, l, g) => s.push(i.value),
    'i32.add': (i, s, l, g) => s.push(s.pop() + s.pop()),
    'i32.ge_s': (i, s, l, g) => s.push(s.pop() >= s.pop()),
}