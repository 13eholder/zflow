'use strict';

async function syncReplica(replica, leader) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await leader.fetchLogs(replica);
    } catch (error) {
      console.log(`retry ${attempt} failed: ${error.message}`);
    }
  }
  throw new Error('replica sync failed');
}

module.exports = { syncReplica };
