(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  var ARMOR_CATEGORIES = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'ClassItem', 'Class Armor'];
  var ARMOR_STAT_KEYS = ['Health', 'Melee', 'Grenade', 'Super', 'Class', 'Weapons'];
  var IGNORED_PERK_RE = /^(livello\s|conta-uccisioni|kill tracker|tracciatore)/i;

  function extractPerks(row, skipZero) {
    var perks = [];
    var keys = Object.keys(row);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (/^Perks\s+\d+$/i.test(key) && row[key]) {
        if (skipZero && /^Perks\s+0$/i.test(key)) continue;
        var val = String(row[key]).trim();
        if (val && !IGNORED_PERK_RE.test(val)) perks.push(val);
      }
    }
    return perks;
  }

  function toNumber(val) {
    var n = Number(val);
    return isNaN(n) ? 0 : n;
  }

  function toBool(val) {
    return String(val).toLowerCase() === 'true';
  }

  function detectCsvType(headers, filename) {
    var headerSet = {};
    for (var i = 0; i < headers.length; i++) {
      headerSet[String(headers[i]).trim()] = true;
    }

    if (headerSet['Equippable'] || headerSet['Resilience (Base)'] || headerSet['Mobility (Base)'] || headerSet['Health (Base)']) {
      return 'armor';
    }
    if (headerSet['Element'] || headerSet['Dmg'] || headerSet['Recoil'] || headerSet['Impact']) {
      return 'weapons';
    }

    var lowerName = String(filename || '').toLowerCase();
    if (lowerName.indexOf('armor') !== -1) return 'armor';
    if (lowerName.indexOf('weapon') !== -1) return 'weapons';

    return 'unknown';
  }

  function normalizeWeapon(row) {
    var rawIntrinsic = row['Perks 0'] ? String(row['Perks 0']).replace(/\*+$/, '').trim() : '';
    var intrinsic = (rawIntrinsic && !IGNORED_PERK_RE.test(rawIntrinsic)) ? rawIntrinsic : '';
    return {
      id: row.Id || '',
      hash: row.Hash || '',
      name: row.Name || '',
      tag: row.Tag || '',
      tier: row.Tier || '',
      type: row.Type || '',
      category: row.Category || '',
      element: row.Element || row.Dmg || '',
      power: toNumber(row.Power),
      owner: row.Owner || '',
      locked: toBool(row.Locked),
      equipped: toBool(row.Equipped),
      crafted: toBool(row.Crafted),
      intrinsic: intrinsic,
      perks: extractPerks(row, true)
    };
  }

  function normalizeArmor(row) {
    var stats = {};
    for (var i = 0; i < ARMOR_STAT_KEYS.length; i++) {
      var stat = ARMOR_STAT_KEYS[i];
      if (row[stat] !== undefined) stats[stat.toLowerCase()] = toNumber(row[stat]);
      var baseKey = stat + ' (Base)';
      if (row[baseKey] !== undefined) stats[stat.toLowerCase() + '_base'] = toNumber(row[baseKey]);
    }
    return {
      id: row.Id || '',
      hash: row.Hash || '',
      name: row.Name || '',
      tag: row.Tag || '',
      tier: row.Tier || '',
      type: row.Type || '',
      equippable: row.Equippable || '',
      category: row.Category || '',
      power: toNumber(row.Power),
      owner: row.Owner || '',
      locked: toBool(row.Locked),
      equipped: toBool(row.Equipped),
      stats: stats,
      perks: extractPerks(row)
    };
  }

  function inferTypeFromRows(rows) {
    if (!rows || rows.length === 0) return 'unknown';
    var cat = rows[0].Category || rows[0].Type || '';
    if (ARMOR_CATEGORIES.indexOf(cat) !== -1) return 'armor';
    return 'weapons';
  }

  function parseAndNormalize(csvText, filename) {
    if (!global.Papa) {
      throw new Error('PapaParse non disponibile.');
    }
    var parsed = global.Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    var headers = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : [];
    var type = detectCsvType(headers, filename);
    if (type === 'unknown') {
      type = inferTypeFromRows(parsed.data);
    }

    var normalizer = type === 'armor' ? normalizeArmor : normalizeWeapon;
    var items = [];
    for (var i = 0; i < parsed.data.length; i++) {
      var row = parsed.data[i];
      if (row && row.Name) {
        var item = normalizer(row);
        if (type === 'armor' && !item.equipped) continue;
        items.push(item);
      }
    }

    return {
      type: type,
      items: items,
      errors: parsed.errors || []
    };
  }

  App.Parser = {
    detectCsvType: detectCsvType,
    normalizeWeapon: normalizeWeapon,
    normalizeArmor: normalizeArmor,
    parseAndNormalize: parseAndNormalize
  };
})(window);
