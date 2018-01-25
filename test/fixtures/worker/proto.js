// This is only what is necessary to test a worker (in this case)

const isArray = Array.isArray.bind(Array)

function addEventListener (event, cb) {
  const { listeners } = this

  if (!isArray(listeners[event]))
  listeners[event] = []

  listeners[event].push(cb)
}

function removeEventListener (event, cb) {
  const { listeners } = this

  if (!isArray(listeners[event])) {
    if (listeners.message === cb)
      delete listeners.message
    else
      return false
  }

  const callbacks = listeners[event]
  const i = callbacks.findIndex(listener => listener === cb)

  if (i < 0) return false

  callbacks.splice(i, 1)

  // if (!callbacks.length) delete listeners[event]

  return true
}

module.exports = function getWorkerProto () {
  const proto = {}
  return Object.assign(proto, {
    listeners: {},
    addEventListener: addEventListener.bind(proto),
    removeEventListener: removeEventListener.bind(proto)
  })
}
