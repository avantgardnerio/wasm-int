int fpow(int x, int y) {
    int z = 1;
    for(int i = 0; i < y; i++) {
        z *= x;
    }
    return z;
}

int fib(int n) {
   if (n <= 1) return n;
   return fib(n-1) + fib(n-2);
}

char *helloWorld() {
    return "Hello, world!";
}

// http://lists.llvm.org/pipermail/llvm-dev/2017-July/115806.html
int stackTest() {
    int x[3];
    x[0] = 2;
    x[1] = 4;
    x[2] = 6;
    return x[1];
}

int stackSaveTest(sz) {
    int x = 42;
    int dyn[sz];
    return 42;
}

int i32add(int a, int b) {
  return a + b;
}

int dropTest(int val) {
    i32add(val, val);
    return val;
}

int i32sub(int a, int b) {
  return a - b;
}

int i32mul(int a, int b) {
  return a * b;
}

int i32div_s(int a, int b) {
  return a / b;
}

int i32div_u(unsigned int a, unsigned int b) {
  return a / b;
}

int i32or(unsigned int a, unsigned int b) {
  return a | b;
}

int i32xor(unsigned int a, unsigned int b) {
  return a ^ b;
}

int i32shl(unsigned int a, unsigned int b) {
  return a << b;
}

int i32eq(unsigned int a, unsigned int b) {
  return a == b;
}

int i32ne(unsigned int a, unsigned int b) {
  return a != b;
}

int i32lt_s(int a, int b) {
  return a < b;
}

int i32shr_s(int a, int b) {
    return a >> b;
}

unsigned int i32shr_u(unsigned int a, unsigned int b) {
    return a >> b;
}

unsigned int i32lt_u(unsigned int a, unsigned int b) {
  return a < b;
}

int i32gt_s(int a, int b) {
  return a > b;
}

unsigned int i32gt_u(unsigned int a, unsigned int b) {
  return a > b;
}

int i32le_s(int a, int b) {
  return a <= b;
}

unsigned int i32le_u(unsigned int a, unsigned int b) {
  return a <= b;
}

int i32ge_s(int a, int b) {
  return a >= b;
}

unsigned int i32ge_u(unsigned int a, unsigned int b) {
  return a >= b;
}
