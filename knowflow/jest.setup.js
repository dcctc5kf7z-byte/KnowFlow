require('@testing-library/jest-dom');
require('fake-indexeddb/auto');

// Polyfill structuredClone for jsdom (needed by fake-indexeddb)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
