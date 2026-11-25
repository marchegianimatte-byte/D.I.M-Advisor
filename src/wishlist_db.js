(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var DB_NAME = 'd2_auditor_db';
  var STORE_NAME = 'wishlist_cache';
  var CACHE_ITEM_KEY = 'main';
  var LEGACY_LS_KEY = 'd2_auditor_wishlist_cache';
  var _memoryCache = null;

  function purgeLegacyLocalStorage() {
    try {
      if (global.localStorage) global.localStorage.removeItem(LEGACY_LS_KEY);
    } catch (e) { /* ignore */ }
  }

  function openDb() {
    purgeLegacyLocalStorage();
    return new Promise(function (resolve, reject) {
      if (!global.indexedDB) { reject(new Error('IndexedDB non supportato')); return; }
      var req = global.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function (ev) { resolve(ev.target.result); };
      req.onerror = function () { reject(req.error || new Error('Errore apertura IndexedDB')); };
    });
  }

  function save(cache) {
    _memoryCache = cache || null;
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        var req = tx.objectStore(STORE_NAME).put(_memoryCache, CACHE_ITEM_KEY);
        req.onsuccess = function () { resolve(_memoryCache); };
        req.onerror = function () { reject(req.error || new Error('Errore salvataggio IndexedDB')); };
      });
    });
  }

  function load() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, 'readonly');
        var req = tx.objectStore(STORE_NAME).get(CACHE_ITEM_KEY);
        req.onsuccess = function () {
          _memoryCache = req.result || null;
          resolve(_memoryCache);
        };
        req.onerror = function () { reject(req.error || new Error('Errore lettura IndexedDB')); };
      });
    }).catch(function () {
      return _memoryCache;
    });
  }

  function clear() {
    _memoryCache = null;
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(CACHE_ITEM_KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      });
    }).catch(function () { return null; });
  }

  function getMemoryCache() { return _memoryCache; }
  function setMemoryCache(cache) { _memoryCache = cache || null; }

  purgeLegacyLocalStorage();

  App.WishlistDB = {
    DB_NAME: DB_NAME, STORE_NAME: STORE_NAME,
    save: save, load: load, clear: clear,
    getMemoryCache: getMemoryCache, setMemoryCache: setMemoryCache
  };
})(window);
