'use strict';

const ErrLeaseExpired = new Error('lease expired');

class Worker {
  async run(signal, timeout, work, release) {
    try {
      return await work(signal);
    } finally {
      release();
    }
  }
}

module.exports = { Worker, ErrLeaseExpired };
