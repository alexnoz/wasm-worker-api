#include <cstdint>
#include <iostream>
#include <chrono>
#include <thread>
#include <cstring>
#include <string>
#include <vector>

#include <emscripten.h>
#include <emscripten/bind.h>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  uint8_t* invert (const uint8_t* data, unsigned length) {
    uint8_t* result = new uint8_t[length];

    for (int i = 0; i < length; i += 4) {
      result[i] = 255 - data[i];
      result[i + 1] = 255 - data[i + 1];
      result[i + 2] = 255 - data[i + 2];
      result[i + 3] = data[i + 3];
    }

    return result;
  }

  EMSCRIPTEN_KEEPALIVE
  int add (int a, int b) {
    return a + b;
  }

  EMSCRIPTEN_KEEPALIVE
  const char* concatenate (const char* a, const char* b) {
    int size = strlen(a) + strlen(b) + 2;

    char* res = new char[size];

    strcpy(res, a);
    strcat(res, b);

    return res;
  }

  EMSCRIPTEN_KEEPALIVE
  int delayedAdd (int a, int b, int sec) {
    std::chrono::seconds dur(sec);
    std::this_thread::sleep_for(dur);

    return a + b;
  }
}

std::string bind_concatenate (std::string a, std::string b) {
  return a + b;
}

EMSCRIPTEN_BINDINGS (module) {
  emscripten::function("bind_concatenate", &bind_concatenate);
}