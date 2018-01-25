const getWorkerProto = require('./proto')

class Worker {
  constructor (url, { name } = {}) {
    this.name = name
    this.self = this
  }
}

Object.assign(Worker.prototype, getWorkerProto())

module.exports = Worker