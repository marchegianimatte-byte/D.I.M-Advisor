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
    var base = entry.eval.verdict === 'TIENI' ? 200 : (entry.eval.verdict === 'ROLL PARZIALE' ? 100 : 0);
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
      return { key: key, hash: copies[0].weapon.hash || '', best: copies[0], copies: copies, count: copies.length };
    });
  }

  App.WeaponEval = {
    stripPerkMarker: stripPerkMarker, resolveArchetype: resolveArchetype,
    normalizeWeaponName: normalizeWeaponName,
    evaluateWeapon: evaluateWeapon, evaluateAll: evaluateAll,
    groupByWeaponKey: groupByWeaponKey, groupByHash: groupByWeaponKey
  };
})(window);
