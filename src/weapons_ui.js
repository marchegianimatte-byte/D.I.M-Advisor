(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function verdictBadgeClass(verdict) {
    if (verdict === 'TIENI') return 'badge badge-keep';
    if (verdict === 'ROLL PARZIALE') return 'badge badge-partial';
    return 'badge badge-trash';
  }

  function renderPerksHtml(perks, matchedPerks) {
    var matchedLower = (matchedPerks || []).map(function (p) { return p.toLowerCase(); });
    return (perks || []).map(function (perk) {
      var clean = App.WeaponEval.stripPerkMarker(perk);
      var isMatch = matchedLower.indexOf(clean.toLowerCase()) !== -1;
      var cls = isMatch ? 'perk-pill perk-match' : 'perk-pill';
      return '<span class="' + cls + '">' + escapeHtml(perk) + '</span>';
    }).join('');
  }

  function populateTypeFilter(weapons) {
    var select = document.getElementById('weapon-type-filter');
    if (!select) return;
    var current = select.value;
    var types = [];
    for (var i = 0; i < weapons.length; i++) {
      var t = weapons[i].type;
      if (t && types.indexOf(t) === -1) types.push(t);
    }
    types.sort();
    var html = '<option value="ALL">Tutti i tipi</option>';
    for (var j = 0; j < types.length; j++) {
      html += '<option value="' + escapeHtml(types[j]) + '">' + escapeHtml(types[j]) + '</option>';
    }
    select.innerHTML = html;
    if (types.indexOf(current) !== -1) select.value = current;
  }

  function render() {
    var tbody = document.getElementById('weapons-table-body');
    var summaryEl = document.getElementById('weapons-filter-summary');
    if (!tbody || !App.Storage || !App.WeaponEval) return;

    var dataset = App.Storage.loadDataset('weapons');
    var weapons = (dataset && dataset.items) ? dataset.items : [];
    populateTypeFilter(weapons);

    var search = (document.getElementById('weapon-search') || {}).value || '';
    var verdictFilter = (document.getElementById('weapon-verdict-filter') || {}).value || 'ALL';
    var typeFilter = (document.getElementById('weapon-type-filter') || {}).value || 'ALL';
    var q = search.trim().toLowerCase();

    var rules = (App.Storage && App.Storage.loadRules) ? App.Storage.loadRules().weapons : null;
    var evaluated = App.WeaponEval.evaluateAll(weapons, rules);
    var filtered = evaluated.filter(function (row) {
      var w = row.weapon;
      if (verdictFilter !== 'ALL' && row.eval.verdict !== verdictFilter) return false;
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false;
      if (q) {
        var hay = (w.name + ' ' + w.type + ' ' + w.perks.join(' ')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    if (summaryEl) {
      summaryEl.textContent = 'Mostrate ' + filtered.length + ' / ' + weapons.length + ' armi';
    }

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessuna arma trovata.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (row) {
      var w = row.weapon;
      var ev = row.eval;
      var comboNote = ev.comboName ? '<div class="combo-note">' + escapeHtml(ev.comboName) + '</div>' : '';
      return '<tr>' +
        '<td><strong>' + escapeHtml(w.name) + '</strong><div class="sub-meta">' + escapeHtml(w.tier) + '</div></td>' +
        '<td>' + escapeHtml(w.type) + '</td>' +
        '<td>' + escapeHtml(w.element || '-') + ' · ' + escapeHtml(w.power) + '</td>' +
        '<td class="perks-cell">' + renderPerksHtml(w.perks, ev.matchedPerks) + '</td>' +
        '<td><span class="' + verdictBadgeClass(ev.verdict) + '">' + escapeHtml(ev.verdict) + '</span>' + comboNote + '</td>' +
      '</tr>';
    }).join('');
  }

  function init() {
    ['weapon-search', 'weapon-verdict-filter', 'weapon-type-filter'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var evt = el.tagName === 'INPUT' ? 'input' : 'change';
      el.addEventListener(evt, render);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  App.WeaponsUI = {
    render: render
  };
})(window);
