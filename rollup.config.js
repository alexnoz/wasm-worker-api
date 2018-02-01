import uglify from 'rollup-plugin-uglify-es'

const umdName = 'wasmWorkerAPI'
const input = 'lib/index.js'

export default [
  {
    input,
    output: [
      {
        // cjs build is only needed for tests
        file: 'dist/index.cjs.js',
        format: 'cjs'
      },
      {
        file: 'umd/index.js',
        format: 'umd',
        name: umdName
      },
      {
        file: 'dist/index.esm.js',
        format: 'es'
      }
    ]
  },
  {
    input,
    output: [
      {
        file: 'umd/index.min.js',
        format: 'umd',
        name: umdName
      },
      {
        file: 'dist/index.esm.min.js',
        format: 'es'
      }
    ],
    plugins: [ uglify() ]
  }
]