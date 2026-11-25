(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var MANIFEST_URL = 'https://www.bungie.net/Platform/Destiny2/Manifest/';
  var SOURCES = {
    aegis: [
      'https://raw.githubusercontent.com/Ciceron14/dim-extra-wishlists/main/Aegis%20Spreadsheets%20Wishlists/Aegis%20Endgame%20Analysis/dim_aegis_endgame.txt',
      'https://raw.githubusercontent.com/Ciceron14/dim-extra-wishlists/main/Aegis%20Spreadsheets%20Wishlists/Aegis%20Endgame%20Analysis/dim_aegis_endgame_major-perks.txt'
    ],
    voltron: [
      'https://raw.githubusercontent.com/48klocs/dim-wish-list-sources/master/voltron.txt'
    ]
  };

  function detectNoteMode(note) {
    var hasPve = /\bpve\b/i.test(note), hasPvp = /\bpvp\b/i.test(note);
    if (hasPve && !hasPvp) return 'pve';
    if (hasPvp && !hasPve) return 'pvp';
    return '';
  }

  function parseDimWishlistTxt(txt, sourceName) {
    var lines = String(txt || '').split(/\r?\n/);
    var rulesByItem = {}, neededPerkIds = {}, currentNote = '', count = 0;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) { currentNote = ''; continue; }
      if (/^\/\/notes:/i.test(line)) { currentNote = line.slice(8).trim(); continue; }
      if (line.charAt(0) === '/' || /^(title|description):/i.test(line)) continue;

      var m = line.match(/^dimwishlist:item=(-?\d+)&perks=([0-9,]+)/i);
      if (!m || Number(m[1]) <= 0) continue;
      var itemHash = m[1];
      var perks = m[2].split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      if (perks.length === 0) continue;

      perks.forEach(function (pid) { neededPerkIds[pid] = true; });
      if (!rulesByItem[itemHash]) rulesByItem[itemHash] = [];
      rulesByItem[itemHash].push({
        perks: perks,
        source: String(sourceName || 'voltron').toLowerCase(),
        mode: detectNoteMode(currentNote)
      });
      count++;
    }
    return { rulesByItem: rulesByItem, neededPerkIds: neededPerkIds, count: count };
  }

  function mergeParsed(parts) {
    var rulesByItem = {}, neededPerkIds = {};
    parts.forEach(function (part) {
      Object.keys(part.neededPerkIds || {}).forEach(function (pid) { neededPerkIds[pid] = true; });
      Object.keys(part.rulesByItem || {}).forEach(function (itemHash) {
        if (!rulesByItem[itemHash]) rulesByItem[itemHash] = [];
        Array.prototype.push.apply(rulesByItem[itemHash], part.rulesByItem[itemHash]);
      });
    });
    return { rulesByItem: rulesByItem, neededPerkIds: neededPerkIds };
  }

  function compactRules(rawRulesByItem, perkMap) {
    var compactByItem = {}, totalCount = 0;
    Object.keys(rawRulesByItem || {}).forEach(function (itemHash) {
      var entries = rawRulesByItem[itemHash] || [], dedupMap = {}, list = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i], names = [], ok = true;
        for (var j = 0; j < e.perks.length; j++) {
          var n = perkMap[e.perks[j]];
          if (!n) { ok = false; break; }
          if (names.indexOf(n) === -1) names.push(n);
        }
        if (!ok || names.length === 0) continue;
        names.sort();
        var mode = e.mode || '';
        var sig = mode + '::' + names.join('|');
        if (!dedupMap[sig]) {
          dedupMap[sig] = { perks: names, sources: [], mode: mode };
          list.push(dedupMap[sig]);
          totalCount++;
        }
        if (e.source && dedupMap[sig].sources.indexOf(e.source) === -1) {
          dedupMap[sig].sources.push(e.source);
        }
      }
      if (list.length > 0) compactByItem[itemHash] = list;
    });
    return { updatedAt: new Date().toISOString(), count: totalCount, rulesByItem: compactByItem };
  }

  function fetchBungiePerkMap(neededPerkIds) {
    var ids = Object.keys(neededPerkIds || {});
    if (ids.length === 0) return Promise.resolve({});
    return fetch(MANIFEST_URL).then(function (r) {
      if (!r.ok) throw new Error('Manifest HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      var itPath = data && data.Response && data.Response.jsonWorldComponentContentPaths &&
        data.Response.jsonWorldComponentContentPaths.it &&
        data.Response.jsonWorldComponentContentPaths.it.DestinyInventoryItemLiteDefinition;
      if (!itPath) throw new Error('Percorso Manifest IT non trovato');
      return fetch('https://www.bungie.net' + itPath);
    }).then(function (r) {
      if (!r.ok) throw new Error('Manifest IT HTTP ' + r.status);
      return r.json();
    }).then(function (defs) {
      var perkMap = {};
      ids.forEach(function (pid) {
        var item = defs[pid], name = item && item.displayProperties && item.displayProperties.name;
        if (name) perkMap[pid] = String(name).trim().toLowerCase();
      });
      return perkMap;
    });
  }

  function syncAll() {
    var jobs = [];
    Object.keys(SOURCES).forEach(function (src) {
      SOURCES[src].forEach(function (url) {
        jobs.push(fetch(url).then(function (r) {
          if (!r.ok) throw new Error(src + ' HTTP ' + r.status);
          return r.text();
        }).then(function (txt) { return parseDimWishlistTxt(txt, src); }));
      });
    });

    return Promise.all(jobs).then(function (parts) {
      var merged = mergeParsed(parts);
      return fetchBungiePerkMap(merged.neededPerkIds).then(function (perkMap) {
        var cache = compactRules(merged.rulesByItem, perkMap);
        return App.WishlistDB ? App.WishlistDB.save(cache) : cache;
      });
    });
  }

  App.WishlistSync = {
    SOURCES: SOURCES,
    parseDimWishlistTxt: parseDimWishlistTxt,
    compactRules: compactRules,
    fetchBungiePerkMap: fetchBungiePerkMap,
    syncAll: syncAll
  };
})(window);
