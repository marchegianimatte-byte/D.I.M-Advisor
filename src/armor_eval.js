(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var STAT_MOD_ALIASES = {
    salute: 'health', health: 'health', 'corpo a corpo': 'melee', melee: 'melee',
    granata: 'grenade', grenade: 'grenade', super: 'super',
    classe: 'class', class: 'class', armi: 'weapons', weapons: 'weapons'
  };

  function getStatLabels() {
    return App.STAT_LABELS || {
      health: 'Salute', melee: 'Corpo a corpo', grenade: 'Granata',
      super: 'Super', class: 'Classe', weapons: 'Armi'
    };
  }

  function isExotic(piece) {
    var p = piece || {};
    return /exotic|esotic/i.test(String(p.tier || '')) ||
      /exotic|esotic/i.test(String(p.rarity || '')) ||
      /exotic|esotic/i.test(String(p.category || '')) ||
      /stoicismo/i.test(String(p.name || ''));
  }

  function getActiveStatKeys(pieces) {
    var keys = Object.keys(getStatLabels()), active = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      for (var j = 0; j < pieces.length; j++) {
        var s = pieces[j].stats || {}, b = pieces[j].baseStats || {};
        if (s[k] !== undefined || b[k] !== undefined || s[k + '_base'] !== undefined) { active.push(k); break; }
      }
    }
    return active;
  }

  function getStatValue(piece, key, includeMods) {
    var s = piece.stats || {}, b = piece.baseStats || {};
    if (includeMods === false) {
      if (b[key] !== undefined) return Number(b[key]) || 0;
      if (s[key + '_base'] !== undefined) return Number(s[key + '_base']) || 0;
    }
    if (s[key] !== undefined) return Number(s[key]) || 0;
    if (b[key] !== undefined) return Number(b[key]) || 0;
    return 0;
  }

  function extractSetName(piece) {
    if (piece.set) return String(piece.set).trim();
    var perks = piece.perks || [];
    for (var i = 0; i < perks.length; i++) {
      var p = String(perks[i]).replace(/\*+$/, '').trim();
      if (p && !/^(\+|mod|artifice|alloggiamento|spirito di|spirito del|vincolo del cuore)/i.test(p)) return p;
    }
    return '';
  }

  function evaluateSets(pieces) {
    var counts = {};
    for (var i = 0; i < pieces.length; i++) {
      if (isExotic(pieces[i])) continue;
      var setName = extractSetName(pieces[i]);
      if (setName) counts[setName] = (counts[setName] || 0) + 1;
    }
    return Object.keys(counts).map(function (name) {
      var count = counts[name];
      return { name: name, count: count, bonus2: count >= 2, bonus4: count >= 4 };
    }).sort(function (a, b) { return b.count - a.count; });
  }

  function findStatInText(txt) {
    var lower = String(txt || '').toLowerCase(), keys = Object.keys(STAT_MOD_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      if (lower.indexOf(keys[i]) !== -1) return STAT_MOD_ALIASES[keys[i]];
    }
    return '';
  }

  function parseStatOrTuningMod(modName) {
    var clean = String(modName || '').replace(/\*+$/, '').trim();
    if (clean.indexOf('/') !== -1) {
      var parts = clean.split('/');
      var plusStat = findStatInText(parts[0]), minusStat = findStatInText(parts[1]);
      var pMatch = parts[0].match(/\+\s*(\d+)/), mMatch = parts[1].match(/-\s*(\d+)/);
      if (plusStat || minusStat) {
        return { plusStat: plusStat, plusVal: pMatch ? Number(pMatch[1]) : 5, minusStat: minusStat, minusVal: mMatch ? Number(mMatch[1]) : 5 };
      }
    }
    var statKey = findStatInText(clean);
    var bonusMatch = clean.match(/\+\s*(5|10)\b/);
    var bonus = bonusMatch ? Number(bonusMatch[1]) : (/minore|minor/i.test(clean) ? 5 : (/maggiore|major|modificatore/i.test(clean) ? 10 : 0));
    return (statKey && bonus) ? { plusStat: statKey, plusVal: bonus, minusStat: '', minusVal: 0 } : null;
  }

  function analyzePieceMods(piece, totalsWithMods, targets, setName) {
    var labels = getStatLabels(), list = piece.mods || piece.perks || [];
    return list.map(function (raw) {
      var name = String(raw || '').replace(/\*+$/, '').trim();
      if (!name || (setName && name.toLowerCase() === setName.toLowerCase())) return null;
      var parsed = parseStatOrTuningMod(name);
      if (!parsed) return { name: name, isStatMod: false, wasted: false, reason: '' };
      var wasted = false, reasons = [];
      if (parsed.plusStat) {
        var tot = totalsWithMods[parsed.plusStat] || 0, rem = tot % 10;
        var cap = targets[parsed.plusStat] !== undefined ? Math.min(200, Number(targets[parsed.plusStat])) : 200;
        if (tot > 200 || (cap > 0 && tot - parsed.plusVal >= cap)) { wasted = true; reasons.push('Oltre cap (' + tot + ')'); }
        else if (rem >= 6) { wasted = true; reasons.push('Resto ' + rem + ' sprecato (' + tot + ')'); }
      }
      if (parsed.minusStat) {
        var mTot = totalsWithMods[parsed.minusStat] || 0, before = mTot + parsed.minusVal;
        if (Math.floor(before / 10) > Math.floor(mTot / 10) || before % 10 >= 8) {
          wasted = true; reasons.push('Riduce ' + (labels[parsed.minusStat] || parsed.minusStat) + ' (' + mTot + ')');
        }
      }
      return { name: name, isStatMod: true, wasted: wasted, reason: reasons.join(', ') || 'Mod OK' };
    }).filter(Boolean);
  }

  function formatWasteSummary(totalWasted, statBreakdown) {
    if (totalWasted === 0) return '0 punti persi: build ottimizzata!';
    var wastedStats = statBreakdown.filter(function (s) { return s.wasted > 0; });
    return totalWasted + ' punti persi tra ' + wastedStats.map(function (s) { return s.label + ' (' + s.wasted + ')'; }).join(', ');
  }

  function evaluateBuild(pieces, armorRules, options) {
    var includeMods = !options || options.includeMods !== false, labels = getStatLabels();
    var equipped = (pieces || []).filter(function (p) { return p && p.equipped; });
    var activeKeys = getActiveStatKeys(equipped), targets = (armorRules && armorRules.statTargets) || {};
    var statBreakdown = [], wastedByKey = {}, totalsWithMods = {}, totalWasted = 0;

    for (var i = 0; i < activeKeys.length; i++) {
      var k = activeKeys[i], total = 0, modTotal = 0;
      for (var j = 0; j < equipped.length; j++) {
        total += getStatValue(equipped[j], k, includeMods);
        modTotal += getStatValue(equipped[j], k, true);
      }
      var wasted = total % 10, target = targets[k] !== undefined ? Number(targets[k]) : null;
      totalWasted += wasted; wastedByKey[k] = wasted; totalsWithMods[k] = modTotal;
      statBreakdown.push({ key: k, label: labels[k] || k, total: total, tier: Math.floor(total / 10), wasted: wasted, target: target, targetMet: target === null ? true : total >= target });
    }

    var sets = evaluateSets(equipped), setCountMap = {};
    sets.forEach(function (s) { setCountMap[s.name] = s.count; });

    var pieceAnalysis = equipped.map(function (piece) {
      var wasteContrib = 0;
      for (var m = 0; m < activeKeys.length; m++) {
        if (wastedByKey[activeKeys[m]] > 0) wasteContrib += Math.min(getStatValue(piece, activeKeys[m], includeMods), wastedByKey[activeKeys[m]]);
      }
      var exotic = isExotic(piece), setName = exotic ? '' : extractSetName(piece);
      var setCount = setName ? (setCountMap[setName] || 0) : 0;
      var incompleteSet = !exotic && setCount > 0 && (setCount === 1 || setCount === 3);
      var modsAnalysis = analyzePieceMods(piece, totalsWithMods, targets, setName);
      var hasWastedMod = modsAnalysis.some(function (ma) { return ma.wasted; });
      var verdict = (incompleteSet || hasWastedMod) ? 'SOSTITUISCI' : ((totalWasted > 0 && wasteContrib > 0) ? 'OTTIMIZZABILE' : 'OK');
      var reason = incompleteSet ? 'Set incompleto (' + setCount + ' pz)' : (hasWastedMod ? 'Mod statistica/tuning sprecata' : (verdict === 'OTTIMIZZABILE' ? 'Punti statistica sprecati' : 'OK'));
      return { piece: piece, setName: setName, wasteContrib: wasteContrib, modsAnalysis: modsAnalysis, verdict: verdict, replaceSuggested: verdict === 'SOSTITUISCI', reason: reason };
    }).sort(function (a, b) { return b.wasteContrib - a.wasteContrib; });

    return { equippedCount: equipped.length, totalWasted: totalWasted, includeMods: includeMods, summaryText: formatWasteSummary(totalWasted, statBreakdown), stats: statBreakdown, sets: sets, pieces: pieceAnalysis };
  }

  function groupEquippedByOwner(armorItems) {
    var groups = {};
    (armorItems || []).forEach(function (item) {
      if (!item || !item.equipped) return;
      var key = item.owner || item.equippable || 'Build';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }

  App.ArmorEval = { getStatLabels: getStatLabels, extractSetName: extractSetName, evaluateSets: evaluateSets, evaluateBuild: evaluateBuild, groupEquippedByOwner: groupEquippedByOwner };
})(window);
