import { key } from './common'

const functions = new Map()
const heapMap = new Map([
  [  'HEAP8',         Int8Array],
  [ 'HEAPU8', Uint8ClampedArray],
  [ 'HEAP16',        Int16Array],
  ['HEAPU16',       Uint16Array],
  [ 'HEAP32',        Int32Array],
  ['HEAPU32',       Uint32Array],
  ['HEAPF32',      Float32Array],
  ['HEAPF64',      Float64Array]
])

let pingPongMsgCounter = 1
let secret

addEventListener('message', once)

function postError (error, id) {
  postMessage({ error, id })
}

function getCurrentId (n = pingPongMsgCounter) {
  return `${secret}-${n}`
}

function once ({ data }) {
  if (typeof data[key] === 'undefined') return

  secret = data[key]

  if (typeof Module === 'undefined') {
    const message = (
      "the 'Module' object is not defined. " +
      "Check if WebAssembly's glue code is imported in the worker before other scripts."
    )
    return postError(message, getCurrentId(0))
  }

  Module.addOnPostRun(() => {
    for (const { name, ret, args } of data.functions) {
      let binded = false

      if (typeof Module[name] === 'function') {
        binded = true
      } else if (typeof Module[`_${name}`] !== 'function') {
        const message = (
          `failed to register the '${name}' function. ` +
          "The C/C++ code doesn't expose the function."
        )
        return postError(message, getCurrentId(0))
      }

      const arrayArgs = []

      args && args.forEach((arg, i) => {
        if (/[0-9]/.test(arg)) {
          args[i] = 'number'
          arrayArgs.push({ index: i, type: arg })
        }
      })

      let returnsArray = false
      let retType = ret
      if (ret && /[0-9]/.test(ret)) {
        returnsArray = true
        retType = 'number'
      }

      let fn = binded ? Module[name] : Module.cwrap(name, retType, args)
      if (arrayArgs.length)
        fn = fnWithArrayArgs(fn, arrayArgs)
      if (returnsArray)
        fn = fnThatReturnsArray(fn, ret)

      functions.set(name, { fn, returnsArray })
    }

    removeEventListener('message', once)
    addEventListener('message', handleMessage)

    postMessage({ [key]: secret , id: getCurrentId(0) })
  })
}

function handleMessage ({ data }) {
  const id = getCurrentId()

  if (data.id !== id) return

  pingPongMsgCounter++

  const funcObj = functions.get(data.name)

  // Unnecessary guard?
  if (!funcObj)
    return postError(`the function '${data.name}' doesn't exist.`, id)

  const message = { name: data.name, id }

  if (funcObj.returnsArray)
    data.args.unshift(data.arrayLength)

  message.ret = funcObj.fn(...data.args)

  postMessage(message, funcObj.returnsArray ? [message.ret.buffer] : [])
}

function fnWithArrayArgs (fn, arrayArgs) {
  return function (...args) {
    const buffers = []

    for (const { index, type } of arrayArgs) {
      const heapType = 'HEAP' + type

      let typedArr = args[index]

      if (!(typedArr instanceof heapMap.get(heapType)))
        typedArr = heapMap.get(heapType).from(typedArr)

      const buf = Module._malloc(typedArr.BYTES_PER_ELEMENT * typedArr.length)
      buffers.push(buf)
      Module[heapType].set(typedArr, buf / typedArr.BYTES_PER_ELEMENT)
      args[index] = buf
    }

    const ret = fn(...args)

    buffers.forEach(buf => Module._free(buf))

    return ret
  }
}

function fnThatReturnsArray (fn, arrayType) {
  return function (length = 1, ...args) {
    const ptr = fn(...args)
    const heapType = 'HEAP' + arrayType
    const typedArr = new (heapMap.get(heapType))(length)
    const start = ptr / typedArr.BYTES_PER_ELEMENT
    const heap = Module[heapType]

    for(let i = start, end = start + length, j = 0; i < end; i++, j++)
      typedArr[j] = heap[i]

    Module._free(ptr)

    return typedArr
  }
}
