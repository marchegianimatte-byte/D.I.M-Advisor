(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderArmorTargets(rules) {
    var container = document.getElementById('rules-armor-targets');
    if (!container) return;
    var targets = (rules.armor && rules.armor.statTargets) || {};
    var labels = App.STAT_LABELS || (App.ArmorEval && App.ArmorEval.getStatLabels()) || {};
    container.innerHTML = Object.keys(targets).map(function (key) {
      return '<label class="rule-stat-item">' +
        '<span>' + escapeHtml(labels[key] || key) + '</span>' +
        '<input class="input rule-stat-input" type="number" min="0" max="200" step="10" data-stat-key="' + escapeHtml(key) + '" value="' + Number(targets[key]) + '">' +
      '</label>';
    }).join('');

    container.querySelectorAll('.rule-stat-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var k = inp.getAttribute('data-stat-key');
        var val = Math.max(0, Math.min(200, Number(inp.value) || 0));
        var current = App.Storage.loadRules();
        current.armor = current.armor || { statTargets: {} };
        current.armor.statTargets[k] = val;
        App.Storage.saveRules(current);
      });
    });
  }

  function renderWeaponCombos(rules) {
    var select = document.getElementById('rules-archetype-select');
    var listEl = document.getElementById('rules-combos-list');
    if (!select || !listEl) return;

    var archetypes = (rules.weapons && rules.weapons.archetypes) || {};
    var keys = Object.keys(archetypes);
    var prev = select.value;
    select.innerHTML = keys.map(function (k) {
      return '<option value="' + escapeHtml(k) + '">' + escapeHtml(archetypes[k].label || k) + '</option>';
    }).join('');
    if (keys.indexOf(prev) !== -1) select.value = prev;

    var activeKey = select.value || keys[0];
    var combos = (archetypes[activeKey] && archetypes[activeKey].combos) || [];
    if (combos.length === 0) {
      listEl.innerHTML = '<p class="sub-meta">Nessuna combinazione configurata.</p>';
      return;
    }

    listEl.innerHTML = combos.map(function (c, idx) {
      var modeLabel = (c.mode || 'pve').toUpperCase();
      return '<div class="combo-card">' +
        '<div><strong>' + escapeHtml(c.name) + '</strong> <span class="mode-pill">' + escapeHtml(modeLabel) + '</span>' +
        '<div class="sub-meta">Col 3: ' + escapeHtml((c.col3 || []).join(', ')) + '</div>' +
        '<div class="sub-meta">Col 4: ' + escapeHtml((c.col4 || []).join(', ')) + '</div></div>' +
        '<button class="btn btn-danger remove-combo-btn" type="button" data-idx="' + idx + '">Rimuovi</button>' +
      '</div>';
    }).join('');

    listEl.querySelectorAll('.remove-combo-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = Number(btn.getAttribute('data-idx'));
        var current = App.Storage.loadRules();
        current.weapons.archetypes[activeKey].combos.splice(idx, 1);
        App.Storage.saveRules(current);
        renderWeaponCombos(current);
      });
    });
  }

  function render() {
    if (!App.Storage || !App.Storage.loadRules) return;
    var rules = App.Storage.loadRules();
    renderArmorTargets(rules);
    renderWeaponCombos(rules);
  }

  function exportJson() {
    var json = JSON.stringify(App.Storage.loadRules(), null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'd2_auditor_rules.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function init() {
    var archSelect = document.getElementById('rules-archetype-select');
    var addBtn = document.getElementById('add-combo-btn');
    var exportBtn = document.getElementById('export-rules-btn');
    var resetBtn = document.getElementById('reset-rules-btn');

    if (archSelect) archSelect.addEventListener('change', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var name = (document.getElementById('new-combo-name') || {}).value || '';
        var mode = (document.getElementById('new-combo-mode') || {}).value || 'pve';
        var c3 = (document.getElementById('new-combo-col3') || {}).value || '';
        var c4 = (document.getElementById('new-combo-col4') || {}).value || '';
        var key = archSelect ? archSelect.value : 'default';
        if (!name.trim() || (!c3.trim() && !c4.trim())) return;
        var splitPerks = function (s) { return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
        var current = App.Storage.loadRules();
        current.weapons.archetypes[key].combos.push({ name: name.trim(), mode: mode, col3: splitPerks(c3), col4: splitPerks(c4) });
        App.Storage.saveRules(current);
        document.getElementById('new-combo-name').value = '';
        document.getElementById('new-combo-col3').value = '';
        document.getElementById('new-combo-col4').value = '';
        renderWeaponCombos(current);
      });
    }
    if (exportBtn) exportBtn.addEventListener('click', exportJson);
    if (resetBtn) resetBtn.addEventListener('click', function () { App.Storage.resetRules(); render(); });

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  App.RulesUI = { render: render, exportJson: exportJson };
})(window);
