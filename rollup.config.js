import uglify from 'rollup-plugin-uglify-es'

const umdName = 'wasmWorkerAPI'
const inputClient = 'lib/client.js'
const inputWorker = 'lib/worker.js'
const outDir = 'dist'

const resolve = (suffix, file = 'client') => `${outDir}/${file}${suffix}.js`

export default [
  {
    input: inputClient,
    output: [
      {
        // cjs build is only needed for tests
        file: resolve('.cjs'),
        format: 'cjs'
      },
      {
        file: 'umd/client.js',
        format: 'umd',
        name: umdName
      },
      {
        file: resolve('.esm'),
        format: 'es'
      }
    ]
  },
  {
    input: inputClient,
    output: [
      {
        file: 'umd/client.min.js',
        format: 'umd',
        name: umdName
      },
      {
        file: resolve('.esm.min'),
        format: 'es'
      }
    ],
    plugins: [ uglify() ]
  },
  {
    input: inputWorker,
    output: {
      file: 'umd/worker.js',
      format: 'iife'
    }
  },
  {
    input: inputWorker,
    output: {
      file: 'umd/worker.min.js',
      format: 'iife'
    },
    plugins: [ uglify() ]
  }
]