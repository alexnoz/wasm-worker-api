const NodeEnvironment = require('jest-environment-node')

const getWorkerProto = require('./proto')

class WorkerEnvironment extends NodeEnvironment {
  setup () {
    super.setup()

    Object.assign(this.global, {
      self: this.global,
      ...getWorkerProto()
    })
  }

  runScript (script) {
    return super.runScript(script)
  }

  teardown () {
    super.teardown()
  }
}

module.exports = WorkerEnvironment