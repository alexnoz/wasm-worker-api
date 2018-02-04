import workerScope from './worker-scope'

function getWorker (pathWithFilename) {
  const slash = pathWithFilename.lastIndexOf('/')
  const path = slash >= 0 ? pathWithFilename.slice(0, slash + 1) : ''
  const workerInners = `(${workerScope.toString()})('${pathWithFilename}', '${path}')`

  return new Worker(
    URL.createObjectURL(new Blob([workerInners]))
  )
}

export default function wasmWorkerAPI (functions, url) {
  if (!Array.isArray(functions))
    throw new TypeError('functions must be an array')

  const api = Object.create(null)
  const types = ['string', 'number', '8', 'U8', '16', 'U16', '32', 'U32', 'F32', 'F64']
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

  const ready = handleMessage(id, (resolve, _) => resolve(api))

  worker.postMessage({
    url: location.toString(),
    functions
  })

  function validateReturnType (name, ret) {
    const validReturnType = types.some(type => type === ret)

    if (!validReturnType) {
      throw new Error(
        `failed to register the '${name}' function. ` +
        `Invalid return type: ${ret}.`
      )
    }
  }

  function validateArgTypes (name, argTypes) {
    if (!Array.isArray(argTypes)) {
      throw new Error(
        `failed to register the '${name}' function. ` +
        "The 'args' field must be an array."
      )
    }

    const invalidArgTypes = new Set()

    argTypes.forEach(argType => {
      const validArgType = types.some(type => type === argType)

      if (!validArgType) invalidArgTypes.add(argType)
    })

    if (invalidArgTypes.size) {
      throw new Error(
        `failed to register the '${name}' function. ` +
        `The following argument types aren't supported: ${
          [...invalidArgTypes].join(', ')
        }`
      )
    }
  }

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

  return ready
}
