// This implementation of Worker's postMessage takes
// target object (the one that will receive messages from this 'thread')
// as the first argument so that we are able
// to simulate communication between threads in our test suite.
module.exports = function postMessage (target, data) {
  const msgListeners = target.listeners.message

  if (Array.isArray(msgListeners))
    msgListeners.forEach(cb => cb({ data }))
  else if (typeof msgListeners === 'function')
    msgListeners({ data })
}