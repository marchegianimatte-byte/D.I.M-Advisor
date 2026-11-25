(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function verdictBadgeClass(verdict) {
    if (verdict === 'TIENI') return 'badge badge-keep';
    if (verdict === 'ROLL PARZIALE') return 'badge badge-partial';
    return 'badge badge-trash';
  }

  function formatTier(tier) {
    var n = Number(tier);
    return (!isNaN(n) && n > 0) ? ('Tier ' + n) : '';
  }

  function renderPerkPills(perks, matchedLower) {
    if (!perks || perks.length === 0) return '<span class="sub-meta">-</span>';
    return perks.map(function (perk) {
      var clean = App.WeaponEval.stripPerkMarker(perk);
      var cls = matchedLower.indexOf(clean.toLowerCase()) !== -1 ? 'perk-pill perk-match' : 'perk-pill';
      return '<span class="' + cls + '">' + escapeHtml(clean) + '</span>';
    }).join('');
  }

  function renderPerksHtml(perks, matchedPerks) {
    var matchedLower = (matchedPerks || []).map(function (p) { return p.toLowerCase(); });
    var active = [], alt = [];
    (perks || []).forEach(function (perk) {
      if (/\*+$/.test(String(perk || '').trim())) active.push(perk);
      else alt.push(perk);
    });
    return '<div class="perks-cols">' +
      '<div class="perks-col"><div class="perks-col-title">Attivi</div><div class="perks-cell">' + renderPerkPills(active, matchedLower) + '</div></div>' +
      '<div class="perks-col"><div class="perks-col-title">Alternativi</div><div class="perks-cell">' + renderPerkPills(alt, matchedLower) + '</div></div>' +
    '</div>';
  }

  function populateTypeFilter(weapons) {
    var select = document.getElementById('weapon-type-filter');
    if (!select) return;
    var current = select.value, types = [];
    for (var i = 0; i < weapons.length; i++) {
      var t = weapons[i].type;
      if (t && types.indexOf(t) === -1) types.push(t);
    }
    types.sort();
    select.innerHTML = '<option value="ALL">Tutti i tipi</option>' + types.map(function (t) {
      return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
    }).join('');
    if (types.indexOf(current) !== -1) select.value = current;
  }

  function renderDrawerRow(group) {
    if (group.count <= 1) return '';
    var itemsHtml = group.copies.map(function (copy, idx) {
      var w = copy.weapon, ev = copy.eval;
      var copyBadge = idx === 0
        ? '<span class="badge badge-keep">MIGLIORE COPIA</span>'
        : '<span class="badge badge-trash">DUPLICATO</span>';
      return '<div class="dup-item">' +
        '<div class="dup-meta">' + copyBadge + ' <span class="' + verdictBadgeClass(ev.verdict) + '">' + escapeHtml(ev.verdict) + '</span>' +
        ' <span class="sub-meta">' + escapeHtml(w.name) + ' · ' + escapeHtml(w.element || '-') + ' · ' + escapeHtml(w.power) + '</span></div>' +
        renderPerksHtml(w.perks, ev.matchedPerks) +
      '</div>';
    }).join('');
    var encodedKey = encodeURIComponent(group.key);
    return '<tr class="dup-drawer-row hidden" data-drawer-key="' + escapeHtml(encodedKey) + '"><td colspan="5"><div class="dup-drawer">' + itemsHtml + '</div></td></tr>';
  }

  function render() {
    var tbody = document.getElementById('weapons-table-body');
    var summaryEl = document.getElementById('weapons-filter-summary');
    if (!tbody || !App.Storage || !App.WeaponEval) return;

    var dataset = App.Storage.loadDataset('weapons');
    var weapons = (dataset && dataset.items) ? dataset.items : [];
    populateTypeFilter(weapons);

    var q = ((document.getElementById('weapon-search') || {}).value || '').trim().toLowerCase();
    var verdictFilter = (document.getElementById('weapon-verdict-filter') || {}).value || 'ALL';
    var typeFilter = (document.getElementById('weapon-type-filter') || {}).value || 'ALL';
    var modeFilter = (document.getElementById('weapon-mode-filter') || {}).value || 'pve';

    var rules = (App.Storage.loadRules) ? App.Storage.loadRules().weapons : null;
    var evaluated = App.WeaponEval.evaluateAll(weapons, rules, modeFilter);
    var filtered = evaluated.filter(function (row) {
      var w = row.weapon;
      if (verdictFilter !== 'ALL' && row.eval.verdict !== verdictFilter) return false;
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false;
      if (q && (w.name + ' ' + w.type + ' ' + (w.intrinsic || '') + ' ' + w.perks.join(' ')).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });

    var groups = App.WeaponEval.groupByWeaponKey(filtered);
    if (summaryEl) summaryEl.textContent = 'Mostrate ' + groups.length + ' armi (' + filtered.length + ' / ' + weapons.length + ' copie)';
    if (groups.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessuna arma trovata.</td></tr>';
      return;
    }

    tbody.innerHTML = groups.map(function (group) {
      var w = group.best.weapon, ev = group.best.eval;
      var comboNote = ev.comboName ? '<div class="combo-note">' + escapeHtml(ev.comboName) + '</div>' : '';
      var copyBtn = group.count > 1
        ? '<button type="button" class="copy-toggle-btn" data-key="' + escapeHtml(encodeURIComponent(group.key)) + '">' + group.count + ' copie ▸</button>'
        : '';
      var subParts = [formatTier(w.tier), w.intrinsic || ''].filter(Boolean).map(escapeHtml).join(' · ');
      return '<tr>' +
        '<td><strong>' + escapeHtml(w.name) + '</strong><div class="sub-meta">' + subParts + copyBtn + '</div></td>' +
        '<td>' + escapeHtml(w.type) + '</td>' +
        '<td>' + escapeHtml(w.element || '-') + ' · ' + escapeHtml(w.power) + '</td>' +
        '<td>' + renderPerksHtml(w.perks, ev.matchedPerks) + '</td>' +
        '<td><span class="' + verdictBadgeClass(ev.verdict) + '">' + escapeHtml(ev.verdict) + '</span>' + comboNote + '</td>' +
      '</tr>' + renderDrawerRow(group);
    }).join('');
  }

  function init() {
    ['weapon-search', 'weapon-verdict-filter', 'weapon-type-filter', 'weapon-mode-filter'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', render);
    });
    var tbody = document.getElementById('weapons-table-body');
    if (tbody) {
      tbody.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('.copy-toggle-btn') : null;
        if (!btn) return;
        var key = btn.getAttribute('data-key');
        var drawers = tbody.querySelectorAll('tr.dup-drawer-row');
        for (var i = 0; i < drawers.length; i++) {
          if (drawers[i].getAttribute('data-drawer-key') === key) {
            drawers[i].classList.toggle('hidden');
            break;
          }
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  App.WeaponsUI = { render: render };
})(window);
