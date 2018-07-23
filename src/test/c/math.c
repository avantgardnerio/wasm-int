int pow(int x, int y) {
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

int strlen(const char *str) {
    const char *s;
    for (s = str; *s; ++s);
    return (s - str);
}

int stackTest(int sz) {
    char str[sz];
    for(int i = 0; i < sz; i++) {
        str[i] = 0;
    }
    return sz;
}

int i32add(int a, int b) {
  return a + b;
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
