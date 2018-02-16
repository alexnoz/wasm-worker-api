import wasmWorkerAPI from 'wasm-worker-api'

const $form = document.getElementById('form')
const $results = document.getElementById('results')

let api

init().then(() => {
  $form.onsubmit = handleSubmit
})

async function init () {
  api = await wasmWorkerAPI([{ name: 'fib' }], 'build/module.js')
  console.log('the worker is ready!')
}

// Without this flag benchmarks can yield falsy results.
// In any case, don't rely on them too much.
let canHandle = true
async function handleSubmit (e) {
  e.preventDefault()

  if (!canHandle) return

  const n = parseInt(this.elements.num.value, 10) || 1

  canHandle = false
  const { res, dur: js } = await measure(() => fib(n))
  const { dur: cpp } = await measure(() => api.fib(n))

  logResults(res, { cpp }, { js })

  canHandle = true
}

function fib (n) {
  return n <= 2 ? 1 : fib(n - 1) + fib(n - 2)
}

async function measure (cb) {
  const start = performance.now()
  const res = await cb()
  const dur = performance.now() - start

  return { res, dur }
}

function logResults (res, ...durations) {
  const div = inners => `<div>${inners}</div>`

  let best = Number.MAX_SAFE_INTEGER

  const html = durations.reduce(
    (html, dur) => {
      const label = Object.keys(dur)[0]
      const val = parseFloat(dur[label])

      if (val < best) best = val

      return html + div(`${label}: ${val}`)
    },
    div(`Result: ${res}`)
  )
  .replace(
    new RegExp(`(<div)(>[\\w:\\s]+${best}</div>)`),
    '$1 class="best"$2'
  )

  $results.insertAdjacentHTML('beforeend', div(html))
  $results.scrollTop = $results.scrollHeight
}
