(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var ARMOR_CATEGORIES = ['Helmet', 'Gauntlets', 'Chest Armor', 'Leg Armor', 'ClassItem', 'Class Armor'];
  var ARMOR_STAT_KEYS = ['Health', 'Melee', 'Grenade', 'Super', 'Class', 'Weapons'];
  var IGNORED_PERK_RE = /^(livello\s|conta-uccisioni|kill tracker|tracciatore)/i;
  var IGNORED_MOD_RE = /^(spirito di\s|spirito del\s|vincolo del cuore|potenziamento armatura|fonte di classe|doratura crescente)|(\bornamento\b|\bornament\b|\bshader\b|\brivestimento\b)/i;

  function extractPerks(row, skipZero) {
    var perks = [], keys = Object.keys(row);
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

  function toNumber(val) { var n = Number(val); return isNaN(n) ? 0 : n; }
  function toBool(val) { return String(val).toLowerCase() === 'true'; }

  function isWishlistMatch(row) {
    var raw = row.Wishlist !== undefined ? row.Wishlist : (row['Wish List'] !== undefined ? row['Wish List'] : '');
    return /^(true|1|yes|wish)$/i.test(String(raw || '').trim());
  }

  function parseWishlistSources(match, note) {
    if (!match) return [];
    var sources = [], n = String(note || '').trim();
    var hasVoltron = /\bvoltron\b|\((pve|pvp)\)|pandapaxxy|mercules/i.test(n);
    var hasAegis = /\baegis\b/i.test(n) || (!hasVoltron && /\b(s-tier|a-tier|b-tier|endgame|dps|add\s*clear|rotation|swap|boss|gm|raid)\b/i.test(n));
    if (hasAegis) sources.push('aegis');
    if (hasVoltron || sources.length === 0) sources.push('voltron');
    return sources;
  }

  function detectCsvType(headers, filename) {
    var headerSet = {};
    for (var i = 0; i < headers.length; i++) headerSet[String(headers[i]).trim()] = true;
    if (headerSet['Equippable'] || headerSet['Resilience (Base)'] || headerSet['Mobility (Base)'] || headerSet['Health (Base)']) return 'armor';
    if (headerSet['Element'] || headerSet['Dmg'] || headerSet['Recoil'] || headerSet['Impact']) return 'weapons';
    var lowerName = String(filename || '').toLowerCase();
    if (lowerName.indexOf('armor') !== -1) return 'armor';
    if (lowerName.indexOf('weapon') !== -1) return 'weapons';
    return 'unknown';
  }

  function normalizeWeapon(row) {
    var rawIntrinsic = row['Perks 0'] ? String(row['Perks 0']).replace(/\*+$/, '').trim() : '';
    var intrinsic = (rawIntrinsic && !IGNORED_PERK_RE.test(rawIntrinsic)) ? rawIntrinsic : '';
    var wMatch = isWishlistMatch(row);
    var wNote = row['Wishlist Note'] !== undefined ? row['Wishlist Note'] : (row['Wish List Note'] !== undefined ? row['Wish List Note'] : '');
    var cleanNote = wNote ? String(wNote).trim() : '';
    return {
      id: row.Id || '', hash: row.Hash || '', name: row.Name || '', tag: row.Tag || '',
      tier: row.Tier || '', rarity: row.Rarity || '', type: row.Type || '', category: row.Category || '',
      element: row.Element || row.Dmg || '', power: toNumber(row.Power), owner: row.Owner || '',
      locked: toBool(row.Locked), equipped: toBool(row.Equipped), crafted: toBool(row.Crafted),
      wishlistMatch: wMatch, wishlistNote: cleanNote, wishlistSources: parseWishlistSources(wMatch, cleanNote),
      intrinsic: intrinsic, perks: extractPerks(row, true)
    };
  }

  function normalizeClassType(equippable) {
    var s = String(equippable || '').trim();
    if (/titan/i.test(s)) return 'Titan';
    if (/cacciator|hunter/i.test(s)) return 'Hunter';
    if (/stregon|warlock/i.test(s)) return 'Warlock';
    return s;
  }

  function normalizeSlot(typeOrCat) {
    var s = String(typeOrCat || '').trim();
    if (/casco|cappuccio|helmet|maschera|elmo/i.test(s)) return 'Helmet';
    if (/guant|morse|gauntlet/i.test(s)) return 'Gauntlets';
    if (/corazza|veste|casacca|chest|torace/i.test(s)) return 'Chest Armor';
    if (/gambal|schinier|stival|leg/i.test(s)) return 'Leg Armor';
    if (/mantell|marchio|patto|class/i.test(s)) return 'ClassItem';
    return s;
  }

  function computeArchetype(baseStats) {
    var labels = App.STAT_LABELS || { health: 'Salute', melee: 'Corpo a corpo', grenade: 'Granata', super: 'Super', class: 'Classe', weapons: 'Armi' };
    var sorted = Object.keys(labels).map(function (k) {
      return { label: labels[k], val: Number(baseStats[k]) || 0 };
    }).sort(function (a, b) { return b.val - a.val; });
    return sorted[0].val > 0 ? (sorted[0].label + ' / ' + sorted[1].label) : '';
  }

  function normalizeArmor(row) {
    var stats = {}, baseStats = {}, baseTotal = 0;
    for (var i = 0; i < ARMOR_STAT_KEYS.length; i++) {
      var stat = ARMOR_STAT_KEYS[i], key = stat.toLowerCase(), baseKey = stat + ' (Base)';
      if (row[stat] !== undefined) stats[key] = toNumber(row[stat]);
      if (row[baseKey] !== undefined) { var bVal = toNumber(row[baseKey]); baseStats[key] = bVal; baseTotal += bVal; }
    }
    var rawPerks = extractPerks(row, false);
    var mods = rawPerks.map(function (p) { return p.replace(/\*+$/, '').trim(); }).filter(function (m) { return m && !IGNORED_MOD_RE.test(m); });
    var equippable = row.Equippable || '';
    return {
      id: row.Id || '', hash: row.Hash || '', name: row.Name || '', tag: row.Tag || '',
      tier: row.Tier || '', rarity: row.Rarity || '', type: row.Type || '',
      equippable: equippable, classType: normalizeClassType(equippable),
      category: row.Category || '', slot: normalizeSlot(row.Category || row.Type),
      power: toNumber(row.Power), owner: row.Owner || '',
      locked: toBool(row.Locked), equipped: toBool(row.Equipped),
      stats: stats, baseStats: baseStats, baseTotal: baseTotal,
      archetype: computeArchetype(baseStats), mods: mods, perks: rawPerks
    };
  }

  function inferTypeFromRows(rows) {
    if (!rows || rows.length === 0) return 'unknown';
    var cat = rows[0].Category || rows[0].Type || '';
    return ARMOR_CATEGORIES.indexOf(cat) !== -1 ? 'armor' : 'weapons';
  }

  function parseAndNormalize(csvText, filename) {
    if (!global.Papa) throw new Error('PapaParse non disponibile.');
    var parsed = global.Papa.parse(csvText, { header: true, skipEmptyLines: true });
    var headers = (parsed.meta && parsed.meta.fields) ? parsed.meta.fields : [];
    var type = detectCsvType(headers, filename);
    if (type === 'unknown') type = inferTypeFromRows(parsed.data);
    var normalizer = type === 'armor' ? normalizeArmor : normalizeWeapon, items = [];
    for (var i = 0; i < parsed.data.length; i++) {
      if (parsed.data[i] && parsed.data[i].Name) items.push(normalizer(parsed.data[i]));
    }
    return { type: type, items: items, errors: parsed.errors || [] };
  }

  App.Parser = {
    detectCsvType: detectCsvType, normalizeWeapon: normalizeWeapon, normalizeArmor: normalizeArmor,
    normalizeSlot: normalizeSlot, normalizeClassType: normalizeClassType, parseAndNormalize: parseAndNormalize
  };
})(window);
