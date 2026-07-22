'use strict';

async function importSnapshot(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, { redirect: 'follow' });
  return {
    status: response.status,
    body: (await response.text()).slice(0, 2048),
  };
}

module.exports = { importSnapshot };
