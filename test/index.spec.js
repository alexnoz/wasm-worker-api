/**
 * @jest-environment <rootDir>/test/fixtures/worker/env
 */

const wasmWorkerAPI = require('../dist/client.cjs')
const Worker = require('./fixtures/worker/mock')
const post = require('./fixtures/worker/post-message')
const worker = new Worker()

worker.postMessage = data => post(global, data)

// This function will be used by the test env
// to post messages to the main 'thread'
function postMessage (data) {
  post(worker, data)
}

describe('wasmWorkerAPI', () => {
  beforeAll(() => {
    Object.assign(global, { Worker, Module: require('./fixtures/build/module'), postMessage })
    global.Module.addOnPostRun = jest.fn().mockImplementation(cb => cb())
  })

  beforeEach(() => {
    delete global.listeners.message
    delete worker.listeners.message

    jest.resetModules()
  })

  test('returns an object with the registered functions', async () => {
    require('../umd/worker')

    const functions =  [
      {
        name: 'add',
        args: ['number', 'number'],
        ret: 'number'
      },
      {
        name: 'invert',
        args: ['U8', 'number'],
        ret: 'U8'
      },
      {
        name: 'concatenate',
        args: ['string', 'string'],
        ret: 'string'
      },
      {
        name: 'delayedAdd',
        args: ['number', 'number', 'number'],
        ret: 'number'
      },
      {
        name: 'bind_concatenate'
      }
    ]

    const api = await wasmWorkerAPI(worker, functions)

    expect(typeof api.add).toBe('function')
    expect(typeof api.invert).toBe('function')
    expect(typeof api.concatenate).toBe('function')
    expect(typeof api.delayedAdd).toBe('function')
    expect(typeof api.bind_concatenate).toBe('function')
  })

  test("throws if the first arg is not a worker", () => {
    expect(() => wasmWorkerAPI(null, [])).toThrow(TypeError)
  })

  test("throws if 'functions' is not an array", () => {
    expect(() => wasmWorkerAPI(worker, null)).toThrow(TypeError)
  })

  test("throws if the 'name' prop is absent", () => {
    const functions = [{}]

    expect(() => wasmWorkerAPI(worker, functions)).toThrow()
  })

  test("throws if the 'name' prop is not a string", () => {
    const functions = [{ name: 25 }]

    expect(() => wasmWorkerAPI(worker, functions)).toThrow(TypeError)
  })

  test('throws if the return type is invalid', () => {
    const functions = [{ name: 'some', ret: 'invalid' }]

    expect(() => wasmWorkerAPI(worker, functions)).toThrow()
  })

  test("throws if a argument's type is invalid", () => {
    const functions = [{ name: 'some', args: ['number', 'invalid'] }]

    expect(() => wasmWorkerAPI(worker, functions)).toThrow()
  })

  test("throws if the 'args' prop is not an array", () => {
    const functions = [{ name: 'some', args: 'not-an-array' }]

    expect(() => wasmWorkerAPI(worker, functions)).toThrow()
  })

  test("throws if a non-existent function's name was passed", async () => {
    require('../umd/worker')

    const functions = [{ name: 'wrongname' }]

    await expect(wasmWorkerAPI(worker, functions)).rejects.toBeInstanceOf(Error)
  })

  test('removes a listener after each function call', async () => {
    require('../umd/worker')

    const functions = [
      {
        name: 'add',
        ret: 'number',
        args: ['number', 'number']
      }
    ]

    const api = await wasmWorkerAPI(worker, functions)

    await api.add(5, 5)
    await api.add(5, 5)
    await api.add(5, 5)

    expect(worker.listeners.message.length).toBe(0)
  })

  describe('wasmWorkerAPI() -> api.fn', () => {
    beforeEach(() => {
      require('../umd/worker')
    })

    test('works with strings', async () => {
      const functions = [
        {
          name: 'concatenate',
          ret: 'string',
          args: ['string', 'string']
        }
      ]
      const api = await wasmWorkerAPI(worker, functions)

      expect(await api.concatenate('Hello, ', 'world!')).toBe('Hello, world!')
    })

    test('works with arrays', async () => {
      const functions = [
        {
          name: 'invert',
          ret: 'U8',
          args: ['U8', 'number']
        }
      ]

      const api = await wasmWorkerAPI(worker, functions)
      const result = new Uint8ClampedArray([135, 105, 205])

      expect(await api.invert([120, 150, 50], 3, 3)).toEqual(result)
    })

    test('works with numbers', async () => {
      const functions = [
        {
          name: 'add',
          ret: 'number',
          args: ['number', 'number']
        }
      ]
      const api = await wasmWorkerAPI(worker, functions)

      expect(await api.add(5, 2)).toBe(7)
    })

    test('works with EMSCRIPTEN_BINDINGS', async () => {
      const functions = [{ name: 'bind_concatenate' }]
      const api = await wasmWorkerAPI(worker, functions)

      expect(await api.bind_concatenate('Hello, ', 'world')).toBe('Hello, world')
    })

    test('works correctly when non-related messages are posted to the worker', async () => {
      const functions = [
        {
          name: 'delayedAdd',
          args: ['number', 'number', 'number'],
          ret: 'number'
        }
      ]
      const api = await wasmWorkerAPI(worker, functions)

      worker.postMessage('dummy')

      const resultPromise = api.delayedAdd(5, 5, 3)

      worker.postMessage('dummy')
      worker.postMessage('dummy')

      expect(await resultPromise).toBe(10)
    })

    test("throws if a fn that returns an array was not passed the array's length", async () => {
      const functions = [
        {
          name: 'invert',
          ret: 'U8',
          args: ['U8', 'number']
        }
      ]

      const api = await wasmWorkerAPI(worker, functions)

      expect(() => api.invert([120, 150, 50], 3)).toThrow()
    })

    test("throws if the array's length is not a number", async () => {
      const functions = [
        {
          name: 'invert',
          ret: 'U8',
          args: ['U8', 'number']
        }
      ]

      const api = await wasmWorkerAPI(worker, functions)

      expect(() => api.invert([120, 150, 50], 3, 'wrong')).toThrow()
    })
  })
})
