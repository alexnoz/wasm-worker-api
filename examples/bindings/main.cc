#include <cstdint>

#include <emscripten/bind.h>

uint32_t fib (uint8_t n) {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2);
}

EMSCRIPTEN_BINDINGS (c) {
  emscripten::function("fib", &fib);
}
