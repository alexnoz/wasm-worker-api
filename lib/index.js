import getWorker from './worker'
import { validateArgTypes, validateReturnType } from './validation'

export default function wasmWorkerAPI (functions, url) {
  if (!Array.isArray(functions))
    throw new TypeError('functions must be an array')

  const api = Object.create(null)
  const worker = getWorker(url)

  let id = 0

  for (const { name, args: argTypes, ret } of functions) {
    if (!name)
      throw new Error("the 'name' field is required.")
    else if (typeof name !== 'string')
      throw new TypeError("the 'name' field should be a string.")

    if (ret) validateReturnType(name, ret)

    if (argTypes) validateArgTypes(name, argTypes)

    const returnsArray = /[0-9]/.test(ret)

    api[name] = returnsArray
      ? fnThatReturnsArray(name, argTypes ? argTypes.length : 0)
      : (...args) => call(name, args)
  }

  const readyPromise = handleMessage(id, (resolve, _) => resolve(api))

  worker.postMessage({
    url: location.toString(),
    functions
  })

  function handleMessage (msgId, callback) {
    return new Promise((resolve, reject) => {
      function onMessage ({ data }) {
        if (data.id !== msgId) return

        worker.removeEventListener('message', onMessage)

        if (data.error)
          return reject(new Error(data.error))

        callback(resolve, data)
      }

      worker.addEventListener('message', onMessage)
    })
  }

  function fnThatReturnsArray (name, declaredLength) {
    return function (...args) {
      if (args.length !== declaredLength + 1) {
        throw new Error(
          `failed to call the '${name}' function. ` +
          "A function that returns an array should accept the array's length " +
          'as the last parameter.'
        )
      }

      const arrayLength = args.pop()

      if (typeof arrayLength !== 'number')
        throw new TypeError('arrayLength must be a number')

      return call(name, args, arrayLength)
    }
  }

  function call (name, args, arrayLength) {
    const promise = handleMessage(++id, (resolve, { ret }) => resolve(ret))
    const transferables = []

    args && args.length && args.forEach(arg => {
      !!arg.buffer && transferables.push(arg.buffer)
    })

    worker.postMessage({ id, name, args, arrayLength }, transferables)

    return promise
  }

  return readyPromise
}
