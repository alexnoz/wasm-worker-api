import uglify from 'rollup-plugin-uglify-es'

const umdName = 'wasmWorkerAPI'
const input = 'lib/index.js'

const resolve = (suffix, dir = 'dist') => `${dir}/index${suffix}.js`

export default [
  {
    input,
    output: [
      {
        // cjs build is only needed for tests
        file: resolve('.cjs'),
        format: 'cjs'
      },
      {
        file: resolve('', 'umd'),
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
    input,
    output: [
      {
        file: resolve('.min', 'umd'),
        format: 'umd',
        name: umdName
      },
      {
        file: resolve('.esm.min'),
        format: 'es'
      }
    ],
    plugins: [ uglify() ]
  }
]