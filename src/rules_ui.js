(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function setImportStatus(msg, isError) {
    var el = document.getElementById('rules-import-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--danger)' : 'var(--success)';
  }

  function renderArmorTargets(rules) {
    var container = document.getElementById('rules-armor-targets');
    if (!container) return;
    var targets = (rules.armor && rules.armor.statTargets) || {};
    var labels = App.STAT_LABELS || (App.ArmorEval && App.ArmorEval.getStatLabels()) || {};
    container.innerHTML = Object.keys(targets).map(function (key) {
      return '<label class="rule-stat-item"><span>' + escapeHtml(labels[key] || key) + '</span>' +
        '<input class="input rule-stat-input" type="number" min="0" max="200" step="10" data-stat-key="' + escapeHtml(key) + '" value="' + Number(targets[key]) + '"></label>';
    }).join('');
    container.querySelectorAll('.rule-stat-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var k = inp.getAttribute('data-stat-key'), val = Math.max(0, Math.min(200, Number(inp.value) || 0));
        var current = App.Storage.loadRules();
        current.armor = current.armor || { statTargets: {} };
        current.armor.statTargets[k] = val;
        App.Storage.saveRules(current);
      });
    });
  }

  function renderWeaponCombos(rules) {
    var select = document.getElementById('rules-archetype-select'), listEl = document.getElementById('rules-combos-list');
    if (!select || !listEl) return;
    var archetypes = (rules.weapons && rules.weapons.archetypes) || {}, keys = Object.keys(archetypes), prev = select.value;
    select.innerHTML = keys.map(function (k) {
      return '<option value="' + escapeHtml(k) + '">' + escapeHtml(archetypes[k].label || k) + '</option>';
    }).join('');
    if (keys.indexOf(prev) !== -1) select.value = prev;
    var activeKey = select.value || keys[0], combos = (archetypes[activeKey] && archetypes[activeKey].combos) || [];
    if (combos.length === 0) { listEl.innerHTML = '<p class="sub-meta">Nessuna combinazione configurata.</p>'; return; }
    listEl.innerHTML = combos.map(function (c, idx) {
      return '<div class="combo-card"><div><strong>' + escapeHtml(c.name) + '</strong> <span class="mode-pill">' + escapeHtml((c.mode || 'pve').toUpperCase()) + '</span>' +
        '<div class="sub-meta">Col 3: ' + escapeHtml((c.col3 || []).join(', ')) + '</div><div class="sub-meta">Col 4: ' + escapeHtml((c.col4 || []).join(', ')) + '</div></div>' +
        '<button class="btn btn-danger remove-combo-btn" type="button" data-idx="' + idx + '">Rimuovi</button></div>';
    }).join('');
    listEl.querySelectorAll('.remove-combo-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = App.Storage.loadRules();
        current.weapons.archetypes[activeKey].combos.splice(Number(btn.getAttribute('data-idx')), 1);
        App.Storage.saveRules(current);
        renderWeaponCombos(current);
      });
    });
  }

  function splitPerks(s) {
    return String(s || '').split(/[|,;]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function importRulesText(text, sourceName) {
    var trimmed = String(text || '').trim(), src = String(sourceName || '').toLowerCase();
    if (/\.txt(\?|$)/i.test(src) || /^dimwishlist:/im.test(trimmed)) {
      setImportStatus('Formato .txt a hash numerici non supportato. Usa .json o .csv testuale.', true);
      return false;
    }
    if (trimmed.charAt(0) === '{' || /\.json(\?|$)/i.test(src)) {
      var parsed = JSON.parse(trimmed);
      if (!parsed || (!parsed.weapons && !parsed.armor)) throw new Error('JSON regole non valido');
      App.Storage.saveRules(parsed);
      render();
      setImportStatus('Regole JSON importate con successo.', false);
      return true;
    }
    if (!global.Papa) throw new Error('PapaParse non disponibile');
    var csv = global.Papa.parse(trimmed, { header: true, skipEmptyLines: true });
    if (!csv.data || csv.data.length === 0) throw new Error('CSV regole vuoto');
    var current = App.Storage.loadRules(), archs = current.weapons.archetypes, added = 0;
    csv.data.forEach(function (r) {
      var archKey = (r.Archetipo || r.Archetype || 'default').trim().toLowerCase();
      var targetArch = archs[archKey] ? archKey : 'default';
      var name = (r.Nome || r.Name || '').trim(), c3 = splitPerks(r['Col 3'] || r.Col3), c4 = splitPerks(r['Col 4'] || r.Col4);
      if (!name || (c3.length === 0 && c4.length === 0)) return;
      var mode = String(r.Mode || 'pve').trim().toLowerCase() === 'pvp' ? 'pvp' : 'pve';
      archs[targetArch].combos.push({ name: name, mode: mode, col3: c3, col4: c4 });
      added++;
    });
    if (added === 0) throw new Error('Nessuna regola valida trovata nel CSV');
    App.Storage.saveRules(current);
    render();
    setImportStatus('Importate ' + added + ' combo da CSV.', false);
    return true;
  }

  function importFromUrl(url) {
    if (!url) return Promise.resolve(false);
    if (/\.txt(\?|$)/i.test(url)) {
      setImportStatus('URL .txt non supportato: usa un file raw .json o .csv.', true);
      return Promise.resolve(false);
    }
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (txt) {
      return importRulesText(txt, url);
    }).catch(function (err) {
      setImportStatus('Errore import URL (verifica CORS): ' + err.message, true);
      return false;
    });
  }

  function render() {
    if (!App.Storage || !App.Storage.loadRules) return;
    var rules = App.Storage.loadRules();
    renderArmorTargets(rules);
    renderWeaponCombos(rules);
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify(App.Storage.loadRules(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'd2_auditor_rules.json'; a.click(); URL.revokeObjectURL(url);
  }

  function init() {
    var archSelect = document.getElementById('rules-archetype-select'), addBtn = document.getElementById('add-combo-btn');
    var exportBtn = document.getElementById('export-rules-btn'), resetBtn = document.getElementById('reset-rules-btn');
    var fileInp = document.getElementById('import-rules-file'), urlBtn = document.getElementById('import-rules-url-btn');

    if (archSelect) archSelect.addEventListener('change', render);
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var name = (document.getElementById('new-combo-name') || {}).value || '', mode = (document.getElementById('new-combo-mode') || {}).value || 'pve';
        var c3 = (document.getElementById('new-combo-col3') || {}).value || '', c4 = (document.getElementById('new-combo-col4') || {}).value || '';
        var key = archSelect ? archSelect.value : 'default';
        if (!name.trim() || (!c3.trim() && !c4.trim())) return;
        var current = App.Storage.loadRules();
        current.weapons.archetypes[key].combos.push({ name: name.trim(), mode: mode, col3: splitPerks(c3), col4: splitPerks(c4) });
        App.Storage.saveRules(current);
        document.getElementById('new-combo-name').value = '';
        document.getElementById('new-combo-col3').value = '';
        document.getElementById('new-combo-col4').value = '';
        renderWeaponCombos(current);
      });
    }
    if (fileInp) {
      fileInp.addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var r = new FileReader();
        r.onload = function (ev) { try { importRulesText(ev.target.result, file.name); } catch (err) { setImportStatus(err.message, true); } };
        r.readAsText(file);
        fileInp.value = '';
      });
    }
    if (urlBtn) urlBtn.addEventListener('click', function () { importFromUrl(((document.getElementById('import-rules-url') || {}).value || '').trim()); });
    if (exportBtn) exportBtn.addEventListener('click', exportJson);
    if (resetBtn) resetBtn.addEventListener('click', function () { App.Storage.resetRules(); render(); setImportStatus('Regole ripristinate al default.', false); });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
  App.RulesUI = { render: render, exportJson: exportJson, importRulesText: importRulesText, importFromUrl: importFromUrl };
})(window);
