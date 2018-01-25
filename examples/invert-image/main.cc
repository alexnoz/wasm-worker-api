#include <cstdint>

#include <emscripten.h>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  const uint8_t* invert (const uint8_t* data, int length) {
    uint8_t* result = new uint8_t[length];

    for (int i = 0; i < length; i += 4) {
      result[i] = 255 - data[i];
      result[i + 1] = 255 - data[i + 1];
      result[i + 2] = 255 - data[i + 2];
      result[i + 3] = data[i + 3];
    }

    return result;
  }
}
