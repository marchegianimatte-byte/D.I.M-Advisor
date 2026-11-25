(function (global) {
  'use strict';

  var App = global.App = global.App || {};
  var STORAGE_KEYS = { weapons: 'd2_auditor_weapons', armor: 'd2_auditor_armor', rules: 'd2_auditor_rules' };

  function cloneDefaultRules() {
    return global.JSON.parse(global.JSON.stringify(App.DEFAULT_RULES || { weapons: {}, armor: { statTargets: {} } }));
  }

  function migrateRules(rules) {
    var def = cloneDefaultRules();
    var out = rules && typeof rules === 'object' ? rules : def;
    out.weapons = out.weapons || def.weapons;
    var archs = out.weapons.archetypes || {};
    Object.keys(archs).forEach(function (k) {
      (archs[k].combos || []).forEach(function (c) {
        if (c.mode !== 'pve' && c.mode !== 'pvp') c.mode = 'pve';
      });
    });

    var labels = App.STAT_LABELS || { health: 'Salute', melee: 'Corpo a corpo', grenade: 'Granata', super: 'Super', class: 'Classe', weapons: 'Armi' };
    var oldTargets = (out.armor && out.armor.statTargets) || {};
    var cleanTargets = {};
    Object.keys(labels).forEach(function (k) {
      var val = oldTargets[k] !== undefined ? Number(oldTargets[k]) : def.armor.statTargets[k];
      cleanTargets[k] = Math.max(0, Math.min(200, isNaN(val) ? 0 : val));
    });
    out.armor = { statTargets: cleanTargets };
    return out;
  }

  function loadRules() {
    var raw = global.localStorage.getItem(STORAGE_KEYS.rules);
    if (!raw) return cloneDefaultRules();
    try { return migrateRules(JSON.parse(raw)); } catch (e) { return cloneDefaultRules(); }
  }

  function refreshAllViews() {
    if (App.WeaponsUI && typeof App.WeaponsUI.render === 'function') App.WeaponsUI.render();
    if (App.ArmorUI && typeof App.ArmorUI.render === 'function') App.ArmorUI.render();
  }

  function saveRules(rulesObj) {
    global.localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(rulesObj));
    refreshAllViews();
  }

  function resetRules() {
    global.localStorage.removeItem(STORAGE_KEYS.rules);
    refreshAllViews();
  }

  function saveDataset(type, items, filename) {
    var key = STORAGE_KEYS[type];
    if (!key) return null;
    var payload = { items: items, filename: filename || '', updatedAt: new Date().toISOString() };
    global.localStorage.setItem(key, JSON.stringify(payload));
    return payload;
  }

  function loadDataset(type) {
    var key = STORAGE_KEYS[type];
    var raw = key ? global.localStorage.getItem(key) : null;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function clearDatasets() {
    global.localStorage.removeItem(STORAGE_KEYS.weapons);
    global.localStorage.removeItem(STORAGE_KEYS.armor);
  }

  function formatMeta(payload) {
    if (!payload || !payload.items) return 'Nessun CSV caricato';
    var dateStr = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('it-IT') : '';
    return (payload.filename ? payload.filename + ' · ' : '') + dateStr;
  }

  function renderCounts() {
    var weapons = loadDataset('weapons');
    var armor = loadDataset('armor');
    var setText = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    setText('weapons-count', weapons && weapons.items ? String(weapons.items.length) : '0');
    setText('weapons-meta', formatMeta(weapons));
    setText('armor-count', armor && armor.items ? String(armor.items.length) : '0');
    setText('armor-meta', formatMeta(armor));
    refreshAllViews();
  }

  function setStatus(message, kind) {
    var el = document.getElementById('status-bar');
    if (!el) return;
    el.textContent = message;
    el.className = 'status-bar' + (kind ? ' ' + kind : '');
  }

  function processFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    var summary = [];
    Array.prototype.slice.call(fileList).forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var result = App.Parser.parseAndNormalize(ev.target.result, file.name);
          if (result.type !== 'weapons' && result.type !== 'armor') {
            setStatus('Tipo CSV non riconosciuto per: ' + file.name, 'error');
            return;
          }
          saveDataset(result.type, result.items, file.name);
          renderCounts();
          summary.push(result.items.length + ' ' + (result.type === 'weapons' ? 'armi' : 'armature') + ' (' + file.name + ')');
          setStatus('Caricati: ' + summary.join(', '), 'ok');
        } catch (err) {
          setStatus('Errore parsing ' + file.name + ': ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  function initTabs() {
    var buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        buttons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('hidden', p.id !== target);
        });
      });
    });
  }

  function initUI() {
    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('csv-file-input');
    var clearBtn = document.getElementById('clear-data-btn');
    initTabs();
    renderCounts();
    if (!dropzone) return;

    dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files) processFiles(e.dataTransfer.files);
    });
    if (fileInput) {
      fileInput.addEventListener('change', function (e) { processFiles(e.target.files); fileInput.value = ''; });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () { clearDatasets(); renderCounts(); setStatus('Dati salvati rimossi.', ''); });
    }
  }

  document.addEventListener('DOMContentLoaded', initUI);
  App.Storage = {
    STORAGE_KEYS: STORAGE_KEYS, saveDataset: saveDataset, loadDataset: loadDataset,
    clearDatasets: clearDatasets, renderCounts: renderCounts,
    loadRules: loadRules, saveRules: saveRules, resetRules: resetRules
  };
})(window);
