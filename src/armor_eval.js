(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  var STAT_LABELS = {
    mobility: 'Mobilità', resilience: 'Resilienza', recovery: 'Recupero',
    discipline: 'Disciplina', intellect: 'Intelletto', strength: 'Forza',
    health: 'Salute', melee: 'Corpo a corpo', grenade: 'Granata',
    super: 'Super', class: 'Classe', weapons: 'Armi'
  };

  function getActiveStatKeys(pieces) {
    var keys = Object.keys(STAT_LABELS);
    var active = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      for (var j = 0; j < pieces.length; j++) {
        var s = pieces[j].stats || {};
        if (s[k] !== undefined || s[k + '_base'] !== undefined) {
          active.push(k);
          break;
        }
      }
    }
    return active;
  }

  function getStatValue(piece, key) {
    var s = piece.stats || {};
    if (s[key] !== undefined) return Number(s[key]) || 0;
    if (s[key + '_base'] !== undefined) return Number(s[key + '_base']) || 0;
    return 0;
  }

  function extractSetName(piece) {
    if (piece.set) return String(piece.set).trim();
    var perks = piece.perks || [];
    for (var i = 0; i < perks.length; i++) {
      var p = String(perks[i]).replace(/\*+$/, '').trim();
      if (p && !/^(\+|mod|artifice|alloggiamento)/i.test(p)) {
        return p;
      }
    }
    return '';
  }

  function evaluateSets(pieces) {
    var counts = {};
    for (var i = 0; i < pieces.length; i++) {
      var setName = extractSetName(pieces[i]);
      if (!setName) continue;
      counts[setName] = (counts[setName] || 0) + 1;
    }
    return Object.keys(counts).map(function (name) {
      var count = counts[name];
      return {
        name: name,
        count: count,
        bonus2: count >= 2,
        bonus4: count >= 4
      };
    }).sort(function (a, b) { return b.count - a.count; });
  }

  function formatWasteSummary(totalWasted, statBreakdown) {
    if (totalWasted === 0) return '0 punti persi: build ottimizzata!';
    var wastedStats = statBreakdown.filter(function (s) { return s.wasted > 0; });
    var names = wastedStats.map(function (s) { return s.label + ' (' + s.wasted + ')'; });
    return totalWasted + ' punti persi tra ' + names.join(', ');
  }

  function evaluateBuild(pieces) {
    var equipped = (pieces || []).filter(function (p) { return p && p.equipped; });
    var activeKeys = getActiveStatKeys(equipped);
    var statBreakdown = [];
    var wastedByKey = {};
    var totalWasted = 0;

    for (var i = 0; i < activeKeys.length; i++) {
      var k = activeKeys[i];
      var total = 0;
      for (var j = 0; j < equipped.length; j++) {
        total += getStatValue(equipped[j], k);
      }
      var wasted = total % 10;
      totalWasted += wasted;
      wastedByKey[k] = wasted;
      statBreakdown.push({
        key: k,
        label: STAT_LABELS[k] || k,
        total: total,
        tier: Math.floor(total / 10),
        wasted: wasted
      });
    }

    var sets = evaluateSets(equipped);
    var dominantSet = sets.length > 0 && sets[0].count >= 2 ? sets[0].name : '';

    var pieceAnalysis = equipped.map(function (piece) {
      var wasteContrib = 0;
      for (var m = 0; m < activeKeys.length; m++) {
        var sk = activeKeys[m];
        if (wastedByKey[sk] > 0) {
          wasteContrib += Math.min(getStatValue(piece, sk), wastedByKey[sk]);
        }
      }
      var setName = extractSetName(piece);
      var offSet = Boolean(dominantSet && setName !== dominantSet && String(piece.tier).toLowerCase() !== 'exotic');
      return {
        piece: piece,
        setName: setName,
        wasteContrib: wasteContrib,
        replaceSuggested: (wasteContrib > 0 && totalWasted > 0) || offSet,
        reason: offSet ? 'Fuori set (' + dominantSet + ')' : (wasteContrib > 0 ? 'Contribuisce a punti sprecati' : 'OK')
      };
    }).sort(function (a, b) { return b.wasteContrib - a.wasteContrib; });

    return {
      equippedCount: equipped.length,
      totalWasted: totalWasted,
      summaryText: formatWasteSummary(totalWasted, statBreakdown),
      stats: statBreakdown,
      sets: sets,
      pieces: pieceAnalysis
    };
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

  App.ArmorEval = {
    STAT_LABELS: STAT_LABELS,
    extractSetName: extractSetName,
    evaluateSets: evaluateSets,
    evaluateBuild: evaluateBuild,
    groupEquippedByOwner: groupEquippedByOwner
  };
})(window);
