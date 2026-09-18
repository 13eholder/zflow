'use strict';

class ValidatedLeaseTimeout {
  constructor(milliseconds) {
    if (!Number.isInteger(milliseconds) || milliseconds <= 0 || milliseconds > 60000) {
      throw new RangeError('invalid lease timeout');
    }
    this.milliseconds = milliseconds;
    Object.freeze(this);
  }
}

function parseLeaseTimeout(milliseconds) {
  return new ValidatedLeaseTimeout(milliseconds);
}

module.exports = { ValidatedLeaseTimeout, parseLeaseTimeout };
