(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function getSlot(piece) {
    if (piece.slot) return piece.slot;
    if (App.Parser && App.Parser.normalizeSlot) return App.Parser.normalizeSlot(piece.category || piece.type);
    return piece.category || piece.type || '';
  }

  function getClass(piece) {
    if (piece.classType) return piece.classType;
    if (App.Parser && App.Parser.normalizeClassType) return App.Parser.normalizeClassType(piece.equippable);
    return piece.equippable || '';
  }

  function computeSetCoherence(currentSets, simSets) {
    var cur4 = currentSets.filter(function (s) { return s.bonus4; }).length;
    var sim4 = simSets.filter(function (s) { return s.bonus4; }).length;
    var cur2 = currentSets.filter(function (s) { return s.bonus2; }).length;
    var sim2 = simSets.filter(function (s) { return s.bonus2; }).length;

    if (sim4 > cur4) return { score: 3, label: 'Completa 4/4' };
    if (sim4 < cur4) return { score: -2, label: 'Rompe 4/4' };
    if (sim2 > cur2) return { score: 2, label: 'Completa 2/2' };
    if (sim2 < cur2) return { score: -1, label: 'Rompe 2/2' };
    if (sim4 > 0) return { score: 1, label: 'Mantiene 4/4' };
    if (sim2 > 0) return { score: 1, label: 'Mantiene 2/2' };
    return { score: 0, label: 'Neutro' };
  }

  function findSlotAlternatives(equippedBuild, allArmor, targetPiece, armorRules, options) {
    if (!App.ArmorEval || !targetPiece) return [];
    var targetSlot = getSlot(targetPiece);
    var activeClass = getClass(targetPiece);
    var currentEval = App.ArmorEval.evaluateBuild(equippedBuild, armorRules, options);

    var candidates = (allArmor || []).filter(function (item) {
      if (!item || item.equipped) return false;
      if (activeClass && getClass(item) !== activeClass) return false;
      return getSlot(item) === targetSlot;
    });

    return candidates.map(function (cand) {
      var simulatedPiece = Object.assign({}, cand, { equipped: true });
      var simBuild = equippedBuild.map(function (p) { return p === targetPiece ? simulatedPiece : p; });
      var simEval = App.ArmorEval.evaluateBuild(simBuild, armorRules, options);
      var coh = computeSetCoherence(currentEval.sets, simEval.sets);
      var setName = App.ArmorEval.extractSetName(cand) || '-';
      return {
        piece: cand,
        setName: setName,
        setScore: coh.score,
        setLabel: coh.label,
        tier: cand.tier,
        archetype: cand.archetype || '-',
        baseTotal: Number(cand.baseTotal) || 0,
        simWasted: simEval.totalWasted,
        deltaWasted: simEval.totalWasted - currentEval.totalWasted
      };
    }).sort(function (a, b) {
      if (b.setScore !== a.setScore) return b.setScore - a.setScore;
      if (a.deltaWasted !== b.deltaWasted) return a.deltaWasted - b.deltaWasted;
      return b.baseTotal - a.baseTotal;
    });
  }

  App.ArmorCompare = {
    getSlot: getSlot,
    getClass: getClass,
    findSlotAlternatives: findSlotAlternatives
  };
})(window);
