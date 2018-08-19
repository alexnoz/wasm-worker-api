# Examples

> To compile the example's C++ code, run `sh ./compile <example-dir>`

**invert-image** - the invert image filter implemented in C++. This example is rather a proof of concept than a real-world use case since returning arrays from wasm functions is slow due to the work required on the JS side.

**bindings** - in this example, the C++ code is defined inside the [EMSCRIPTEN_BINDINGS](https://kripken.github.io/emscripten-site/docs/api_reference/bind.h.html#_CPPv219EMSCRIPTEN_BINDINGS4name) block and compiled with the [--bind](https://kripken.github.io/emscripten-site/docs/tools_reference/emcc.html#emcc-bind) option. Also, here you can see a performance comparison of C++ and JS calculations of the Fibonacci numbers. Note that these 'benchmarks' by no means reliable, so don't treat them as such.
