(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function stripPerkMarker(perk) {
    return String(perk || '').replace(/\*+$/, '').trim();
  }

  function toLowerList(list) {
    var out = [];
    for (var i = 0; i < (list || []).length; i++) out.push(String(list[i]).trim().toLowerCase());
    return out;
  }

  function findMatches(weaponPerks, targetList) {
    var targets = toLowerList(targetList);
    var matched = [];
    for (var i = 0; i < weaponPerks.length; i++) {
      var clean = stripPerkMarker(weaponPerks[i]);
      if (clean && targets.indexOf(clean.toLowerCase()) !== -1 && matched.indexOf(clean) === -1) {
        matched.push(clean);
      }
    }
    return matched;
  }

  function resolveArchetype(weaponType, rules) {
    var aliases = (rules && rules.typeAliases) || {};
    var archetypes = (rules && rules.archetypes) || {};
    var key = aliases[String(weaponType || '').trim().toLowerCase()] || 'default';
    return archetypes[key] ? key : 'default';
  }

  function matchSyncedWishlist(weapon, targetMode) {
    var cache = App.WishlistDB && App.WishlistDB.getMemoryCache ? App.WishlistDB.getMemoryCache() : null;
    var entries = cache && cache.rulesByItem && weapon && weapon.hash ? cache.rulesByItem[String(weapon.hash)] : null;
    if (!entries || entries.length === 0) return null;

    var perkSet = {};
    (weapon.perks || []).forEach(function (p) {
      var c = stripPerkMarker(p).toLowerCase();
      if (c) perkSet[c] = true;
    });

    var sources = [], srcMap = {}, matchedPerks = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (targetMode !== 'all' && e.mode && e.mode !== targetMode) continue;
      var allPresent = true;
      for (var j = 0; j < e.perks.length; j++) {
        if (!perkSet[e.perks[j]]) { allPresent = false; break; }
      }
      if (!allPresent) continue;
      (e.sources || []).forEach(function (src) {
        if (src && !srcMap[src]) { srcMap[src] = true; sources.push(src); }
      });
      e.perks.forEach(function (p) { if (matchedPerks.indexOf(p) === -1) matchedPerks.push(p); });
    }
    if (sources.length === 0) return null;
    return { sources: sources, matchedPerks: matchedPerks };
  }

  function evaluateWeapon(weapon, customRules, mode) {
    var rules = customRules || (App.DEFAULT_RULES && App.DEFAULT_RULES.weapons) || {};
    var archetypes = rules.archetypes || {};
    var archKey = resolveArchetype(weapon && weapon.type, rules);
    var arch = archetypes[archKey] || archetypes.default || { combos: [] };
    var targetMode = (mode === 'pve' || mode === 'pvp') ? mode : 'all';
    var combos = (arch.combos || []).filter(function (c) {
      return targetMode === 'all' || (c.mode || 'pve') === targetMode;
    });
    var perks = (weapon && weapon.perks) || [];
    var bestKeep = null, partialMatches = [], partialCombo = '';

    for (var i = 0; i < combos.length; i++) {
      var combo = combos[i];
      var m3 = findMatches(perks, combo.col3);
      var m4 = findMatches(perks, combo.col4);
      if (m3.length > 0 && m4.length > 0) {
        var combined = m3.concat(m4);
        if (!bestKeep || combined.length > bestKeep.matched.length) {
          bestKeep = { comboName: combo.name, matched: combined };
        }
      } else if (m3.length > 0 || m4.length > 0) {
        var partial = m3.concat(m4);
        for (var j = 0; j < partial.length; j++) {
          if (partialMatches.indexOf(partial[j]) === -1) partialMatches.push(partial[j]);
        }
        if (!partialCombo) partialCombo = combo.name;
      }
    }

    var synced = matchSyncedWishlist(weapon, targetMode);
    if (synced) {
      var mergedMatched = synced.matchedPerks.slice();
      (bestKeep ? bestKeep.matched : partialMatches).forEach(function (p) {
        if (mergedMatched.indexOf(p) === -1) mergedMatched.push(p);
      });
      return {
        verdict: 'TIENI',
        comboName: synced.note || (bestKeep && bestKeep.comboName) || 'Wishlist',
        matchedPerks: mergedMatched,
        archetype: archKey,
        isWishlist: true,
        wishlistSources: synced.sources
      };
    }

    if (weapon && weapon.wishlistMatch === true) {
      return {
        verdict: 'TIENI (Wishlist DIM)',
        comboName: weapon.wishlistNote || (bestKeep && bestKeep.comboName) || 'Wishlist DIM',
        matchedPerks: bestKeep ? bestKeep.matched : partialMatches,
        archetype: archKey,
        isWishlist: true,
        wishlistSources: weapon.wishlistSources && weapon.wishlistSources.length ? weapon.wishlistSources : ['voltron']
      };
    }
    if (bestKeep) return { verdict: 'TIENI', comboName: bestKeep.comboName, matchedPerks: bestKeep.matched, archetype: archKey };
    if (partialMatches.length > 0) return { verdict: 'ROLL PARZIALE', comboName: partialCombo, matchedPerks: partialMatches, archetype: archKey };
    return { verdict: 'INFONDI/SCARTA', comboName: '', matchedPerks: [], archetype: archKey };
  }

  function evaluateAll(weapons, customRules, mode) {
    return (weapons || []).map(function (w) {
      return { weapon: w, eval: evaluateWeapon(w, customRules, mode) };
    });
  }

  function rankScore(entry) {
    var v = entry.eval.verdict;
    var base = v === 'TIENI (Wishlist DIM)' ? 300 : (v === 'TIENI' ? 200 : (v === 'ROLL PARZIALE' ? 100 : 0));
    return base + (entry.eval.matchedPerks ? entry.eval.matchedPerks.length : 0);
  }

  function normalizeWeaponName(name) {
    return String(name || '').replace(/\s*\((adepta|adept)\)\s*$/i, '').trim().toLowerCase();
  }

  function groupByWeaponKey(evaluatedList) {
    var map = {}, order = [];
    (evaluatedList || []).forEach(function (entry) {
      var normName = normalizeWeaponName(entry.weapon.name);
      var normType = String(entry.weapon.type || '').trim().toLowerCase();
      var key = normName + '::' + normType;
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(entry);
    });
    return order.map(function (key) {
      var copies = map[key].slice().sort(function (a, b) { return rankScore(b) - rankScore(a); });
      var wishlistMatch = false, srcMap = {}, wishlistSources = [];
      copies.forEach(function (c) {
        if ((c.weapon && c.weapon.wishlistMatch) || (c.eval && c.eval.isWishlist)) wishlistMatch = true;
        var srcs = (c.eval && c.eval.wishlistSources) || (c.weapon && c.weapon.wishlistSources) || [];
        srcs.forEach(function (s) {
          var low = String(s || '').trim().toLowerCase();
          if (low && !srcMap[low]) { srcMap[low] = true; wishlistSources.push(low); }
        });
      });
      return {
        key: key, hash: copies[0].weapon.hash || '', best: copies[0],
        copies: copies, count: copies.length,
        wishlistMatch: wishlistMatch, wishlistSources: wishlistSources
      };
    });
  }

  App.WeaponEval = {
    stripPerkMarker: stripPerkMarker, resolveArchetype: resolveArchetype,
    normalizeWeaponName: normalizeWeaponName,
    evaluateWeapon: evaluateWeapon, evaluateAll: evaluateAll,
    groupByWeaponKey: groupByWeaponKey, groupByHash: groupByWeaponKey
  };
})(window);
