(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  var STORAGE_KEYS = {
    weapons: 'd2_auditor_weapons',
    armor: 'd2_auditor_armor'
  };

  function saveDataset(type, items, filename) {
    var key = STORAGE_KEYS[type];
    if (!key) return null;
    var payload = {
      items: items,
      filename: filename || '',
      updatedAt: new Date().toISOString()
    };
    global.localStorage.setItem(key, JSON.stringify(payload));
    return payload;
  }

  function loadDataset(type) {
    var key = STORAGE_KEYS[type];
    if (!key) return null;
    var raw = global.localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function clearDatasets() {
    global.localStorage.removeItem(STORAGE_KEYS.weapons);
    global.localStorage.removeItem(STORAGE_KEYS.armor);
  }

  function formatMeta(payload) {
    if (!payload || !payload.items) return 'Nessun CSV caricato';
    var dateStr = payload.updatedAt ? new Date(payload.updatedAt).toLocaleString('it-IT') : '';
    var namePart = payload.filename ? payload.filename + ' · ' : '';
    return namePart + dateStr;
  }

  function renderCounts() {
    var weapons = loadDataset('weapons');
    var armor = loadDataset('armor');

    var wCountEl = document.getElementById('weapons-count');
    var wMetaEl = document.getElementById('weapons-meta');
    var aCountEl = document.getElementById('armor-count');
    var aMetaEl = document.getElementById('armor-meta');

    if (wCountEl) wCountEl.textContent = weapons && weapons.items ? String(weapons.items.length) : '0';
    if (wMetaEl) wMetaEl.textContent = formatMeta(weapons);
    if (aCountEl) aCountEl.textContent = armor && armor.items ? String(armor.items.length) : '0';
    if (aMetaEl) aMetaEl.textContent = formatMeta(armor);
  }

  function setStatus(message, kind) {
    var el = document.getElementById('status-bar');
    if (!el) return;
    el.textContent = message;
    el.className = 'status-bar' + (kind ? ' ' + kind : '');
  }

  function processFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    var files = Array.prototype.slice.call(fileList);
    var summary = [];

    files.forEach(function (file) {
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
          var label = result.type === 'weapons' ? 'armi' : 'armature';
          summary.push(result.items.length + ' ' + label + ' (' + file.name + ')');
          setStatus('Caricati: ' + summary.join(', '), 'ok');
        } catch (err) {
          setStatus('Errore parsing ' + file.name + ': ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  function initUI() {
    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('csv-file-input');
    var clearBtn = document.getElementById('clear-data-btn');

    renderCounts();

    if (!dropzone) return;

    dropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });

    dropzone.addEventListener('dragleave', function () {
      dropzone.classList.remove('drag-over');
    });

    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        processFiles(e.target.files);
        fileInput.value = '';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearDatasets();
        renderCounts();
        setStatus('Dati salvati rimossi.', '');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initUI);

  App.Storage = {
    STORAGE_KEYS: STORAGE_KEYS,
    saveDataset: saveDataset,
    loadDataset: loadDataset,
    clearDatasets: clearDatasets,
    renderCounts: renderCounts
  };
})(window);
