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

  function populateOwnerSelect(groups) {
    var select = document.getElementById('armor-owner-filter');
    if (!select) return '';
    var owners = Object.keys(groups);
    if (owners.length === 0) {
      select.innerHTML = '<option value="">Nessun pezzo equipaggiato</option>';
      return '';
    }
    var current = select.value;
    select.innerHTML = owners.map(function (o) {
      return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
    }).join('');
    if (owners.indexOf(current) !== -1) {
      select.value = current;
    }
    return select.value;
  }

  function renderStats(stats) {
    var grid = document.getElementById('armor-stats-grid');
    if (!grid) return;
    if (!stats || stats.length === 0) {
      grid.innerHTML = '';
      return;
    }
    grid.innerHTML = stats.map(function (s) {
      var cls = s.wasted > 0 ? 'stat-waste-warn' : 'stat-waste-ok';
      var targetBadge = s.target !== null
        ? ' <span class="badge ' + (s.targetMet ? 'badge-keep' : 'badge-trash') + '">' + (s.targetMet ? 'Target OK' : 'Sotto ' + s.target) + '</span>'
        : '';
      return '<div class="armor-stat-card">' +
        '<div class="stat-label">' + escapeHtml(s.label) + '</div>' +
        '<div class="armor-stat-val">' + s.total + ' <span class="sub-meta">(Tier ' + s.tier + ')</span>' + targetBadge + '</div>' +
        '<div class="' + cls + '">' + (s.wasted > 0 ? s.wasted + ' sprecati' : '0 sprecati') + '</div>' +
      '</div>';
    }).join('');
  }

  function renderSets(sets) {
    var el = document.getElementById('armor-sets-list');
    if (!el) return;
    if (!sets || sets.length === 0) {
      el.innerHTML = '<span class="sub-meta">Nessun bonus set rilevato sui pezzi equipaggiati.</span>';
      return;
    }
    el.innerHTML = sets.map(function (s) {
      var b2 = s.bonus2 ? '<span class="badge badge-keep">2 Pezzi OK</span>' : '<span class="badge badge-trash">2 Pezzi NO</span>';
      var b4 = s.bonus4 ? '<span class="badge badge-keep">4 Pezzi OK</span>' : '<span class="badge badge-partial">4 Pezzi (' + s.count + '/4)</span>';
      return '<div class="set-row"><strong>' + escapeHtml(s.name) + '</strong> (' + s.count + ' pz) ' + b2 + ' ' + b4 + '</div>';
    }).join('');
  }

  function formatTier(tier) {
    var n = Number(tier);
    return (!isNaN(n) && n > 0) ? ('Tier ' + n) : '';
  }

  function renderModsHtml(modsAnalysis, setName) {
    var filtered = (modsAnalysis || []).filter(function (m) {
      if (!m || !m.name) return false;
      if (setName && m.name.toLowerCase() === setName.toLowerCase()) return false;
      return !/^(spirito di\s|spirito del\s|vincolo del cuore|potenziamento armatura|fonte di classe|doratura crescente)|(\bornamento\b|\bornament\b|\bshader\b|\brivestimento\b)/i.test(m.name);
    });
    if (filtered.length === 0) return '<span class="sub-meta">-</span>';
    return '<div class="perks-cell">' + filtered.map(function (m) {
      if (m.wasted) {
        return '<span class="perk-pill mod-waste" title="' + escapeHtml(m.reason) + '">' + escapeHtml(m.name) + ' (' + escapeHtml(m.reason) + ')</span>';
      }
      var cls = m.isStatMod ? 'perk-pill perk-match' : 'perk-pill';
      return '<span class="' + cls + '">' + escapeHtml(m.name) + '</span>';
    }).join('') + '</div>';
  }

  function verdictBadge(verdict) {
    if (verdict === 'SOSTITUISCI') return '<span class="badge badge-trash">SOSTITUISCI</span>';
    if (verdict === 'OTTIMIZZABILE') return '<span class="badge badge-partial">OTTIMIZZABILE</span>';
    return '<span class="badge badge-keep">OK</span>';
  }

  function renderPieces(pieceAnalysis) {
    var tbody = document.getElementById('armor-table-body');
    if (!tbody) return;
    if (!pieceAnalysis || pieceAnalysis.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessun pezzo equipaggiato trovato.</td></tr>';
      return;
    }
    tbody.innerHTML = pieceAnalysis.map(function (entry) {
      var p = entry.piece;
      var tierLabel = formatTier(p.tier);
      return '<tr>' +
        '<td><strong>' + escapeHtml(p.name) + '</strong>' + (tierLabel ? '<div class="sub-meta">' + escapeHtml(tierLabel) + '</div>' : '') + '</td>' +
        '<td>' + escapeHtml(p.category || p.type) + '</td>' +
        '<td>' + escapeHtml(entry.setName || '-') + '</td>' +
        '<td>' + renderModsHtml(entry.modsAnalysis, entry.setName) + '</td>' +
        '<td>' + verdictBadge(entry.verdict) + '<div class="sub-meta">' + escapeHtml(entry.reason) + '</div></td>' +
      '</tr>';
    }).join('');
  }

  function render() {
    var summaryEl = document.getElementById('armor-waste-summary');
    if (!summaryEl || !App.Storage || !App.ArmorEval) return;

    var dataset = App.Storage.loadDataset('armor');
    var items = (dataset && dataset.items) ? dataset.items : [];
    var groups = App.ArmorEval.groupEquippedByOwner(items);
    var selectedOwner = populateOwnerSelect(groups);
    var selectedPieces = selectedOwner ? groups[selectedOwner] : [];

    if (!selectedPieces || selectedPieces.length === 0) {
      summaryEl.textContent = 'Carica destinyArmor.csv con pezzi equipaggiati per analizzare la build.';
      summaryEl.className = 'status-bar';
      renderStats([]);
      renderSets([]);
      renderPieces([]);
      return;
    }

    var toggleEl = document.getElementById('armor-include-mods');
    var includeMods = toggleEl ? toggleEl.checked : true;
    var armorRules = (App.Storage && App.Storage.loadRules) ? App.Storage.loadRules().armor : null;
    var result = App.ArmorEval.evaluateBuild(selectedPieces, armorRules, { includeMods: includeMods });
    summaryEl.textContent = result.summaryText;
    summaryEl.className = 'status-bar ' + (result.totalWasted === 0 ? 'ok' : 'error');
    renderStats(result.stats);
    renderSets(result.sets);
    renderPieces(result.pieces);
  }

  function init() {
    var select = document.getElementById('armor-owner-filter');
    var toggle = document.getElementById('armor-include-mods');
    if (select) select.addEventListener('change', render);
    if (toggle) toggle.addEventListener('change', render);
  }

  document.addEventListener('DOMContentLoaded', init);

  App.ArmorUI = {
    render: render
  };
})(window);
