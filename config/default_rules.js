(function (global) {
  'use strict';

  var App = global.App = global.App || {};

  App.DEFAULT_RULES = {
    weapons: {
      typeAliases: {
        'hand cannon': 'hand_cannon', 'cannone portatile': 'hand_cannon',
        'auto rifle': 'auto_rifle', 'fucile automatico': 'auto_rifle',
        'pulse rifle': 'pulse_rifle', 'fucile a impulsi': 'pulse_rifle',
        'submachine gun': 'smg', 'mitraglietta': 'smg',
        'scout rifle': 'scout_rifle', 'fucile da ricognizione': 'scout_rifle',
        'sidearm': 'sidearm', 'arma da supporto': 'sidearm',
        'bow': 'bow', 'arco': 'bow',
        'shotgun': 'shotgun', 'fucile a pompa': 'shotgun',
        'sniper rifle': 'sniper_rifle', 'fucile di precisione': 'sniper_rifle',
        'fusion rifle': 'fusion_rifle', 'fucile a fusione': 'fusion_rifle',
        'rocket launcher': 'rocket_launcher', 'lanciarazzi': 'rocket_launcher',
        'linear fusion rifle': 'linear_fusion', 'fucile a fusione lineare': 'linear_fusion',
        'grenade launcher': 'grenade_launcher', 'lanciagranate': 'grenade_launcher',
        'machine gun': 'machine_gun', 'mitragliatrice': 'machine_gun',
        'sword': 'sword', 'spada': 'sword'
      },
      archetypes: {
        hand_cannon: {
          label: 'Cannone portatile',
          combos: [
            { name: 'PvE Add Clear', col3: ['Fuorilegge', 'Alimenta la frenesia', 'Sussistenza', 'Demolitore', 'Proiettili a riavvolgimento'], col4: ['Carica esplosiva', 'Libellula', 'Frenesia', 'Incandescente', 'Scarica voltaica', 'Colpo destabilizzante', 'Lapide'] },
            { name: 'PvP Duello', col3: ['Movimento perpetuo', 'Mirino rapido', 'Telemetro', 'Estrazione rapida'], col4: ['Occhio del ciclone', 'Apertura', 'Caricatore della morte', 'Momento zen'] }
          ]
        },
        auto_rifle: {
          label: 'Fucile automatico',
          combos: [
            { name: 'PvE Sostenuto', col3: ['Sussistenza', 'Proiettili a riavvolgimento', 'Straripamento', 'Demolitore', 'Statistiche per tutti'], col4: ['Frenesia', 'Uno per tutti', 'Incandescente', 'Scarica voltaica', 'Scosse cinetiche', 'Furia'] }
          ]
        },
        pulse_rifle: {
          label: 'Fucile a impulsi',
          combos: [
            { name: 'PvE', col3: ['Fuorilegge', 'Alimenta la frenesia', 'Demolitore', 'Proiettili a riavvolgimento'], col4: ['Frenesia', 'Uno per tutti', 'Scosse cinetiche', 'Incandescente', 'Scarica voltaica', 'Lapide'] },
            { name: 'PvP', col3: ['Movimento perpetuo', 'Momento zen', 'Sotto pressione'], col4: ['Lapide', 'Caricatore della morte', 'Occhio del ciclone'] }
          ]
        },
        smg: {
          label: 'Mitraglietta',
          combos: [
            { name: 'PvE Add Clear', col3: ['Alimenta la frenesia', 'Sussistenza', 'Demolitore', 'Straripamento'], col4: ['Frenesia', 'Incandescente', 'Scarica voltaica', 'Colpo destabilizzante', 'Uno per tutti'] }
          ]
        },
        scout_rifle: {
          label: 'Fucile da ricognizione',
          combos: [
            { name: 'PvE Endgame', col3: ['Tripletta', 'Quarto colpo fortunato', 'Fuorilegge', 'Proiettili a riavvolgimento'], col4: ['Carica esplosiva', 'Scosse cinetiche', 'Frenesia', 'Incandescente', 'Scarica voltaica'] }
          ]
        },
        rocket_launcher: {
          label: 'Lanciarazzi',
          combos: [
            { name: 'PvE DPS', col3: ['Ricostruzione', 'Assassino invidioso', 'Fondina auto-caricante', 'Demolitore', 'Modulo di tracciamento'], col4: ['Esca e scambia', 'Luce esplosiva', 'Arma vorpal', 'Frenesia'] }
          ]
        },
        linear_fusion: {
          label: 'Fucile a fusione lineare',
          combos: [
            { name: 'PvE DPS', col3: ['Tripletta', 'Quarto colpo fortunato', 'Proiettili a riavvolgimento', 'Assassino invidioso'], col4: ['Esca e scambia', 'Arma vorpal', 'Frenesia'] }
          ]
        },
        grenade_launcher: {
          label: 'Lanciagranate',
          combos: [
            { name: 'PvE Utility/DPS', col3: ['Fondina auto-caricante', 'Assassino invidioso', 'Demolitore', 'Ricostruzione'], col4: ['Esca e scambia', 'Luce esplosiva', 'Arma vorpal', 'Frenesia', 'Munizioni gelide'] }
          ]
        },
        sniper_rifle: {
          label: 'Fucile di precisione',
          combos: [
            { name: 'PvE DPS', col3: ['Tripletta', 'Quarto colpo fortunato', 'Ricostruzione', 'Proiettili a riavvolgimento'], col4: ['Arma vorpal', 'Esca e scambia', 'Frenesia'] },
            { name: 'PvP', col3: ['Mirino rapido', 'Estrazione rapida'], col4: ['Apertura', 'Movimento perpetuo'] }
          ]
        },
        shotgun: {
          label: 'Fucile a pompa',
          combos: [
            { name: 'PvE/PvP', col3: ['Fondina auto-caricante', 'Ricostruzione', 'Estrazione rapida', 'Sotto pressione'], col4: ['Arma vorpal', 'Apertura', 'Pugilista', 'Frenesia'] }
          ]
        },
        fusion_rifle: {
          label: 'Fucile a fusione',
          combos: [
            { name: 'PvE/PvP', col3: ['Ricostruzione', 'Fondina auto-caricante', 'Assassino invidioso', 'Sotto pressione'], col4: ['Munizioni gelide', 'Arma vorpal', 'Frenesia', 'Incandescente'] }
          ]
        },
        machine_gun: {
          label: 'Mitragliatrice',
          combos: [
            { name: 'PvE Add Clear/DPS', col3: ['Ricostruzione', 'Proiettili a riavvolgimento', 'Assassino invidioso', 'Sussistenza', 'Tripletta'], col4: ['Esca e scambia', 'Incandescente', 'Colpo destabilizzante', 'Frenesia', 'Arma vorpal'] }
          ]
        },
        sword: {
          label: 'Spada',
          combos: [
            { name: 'PvE DPS', col3: ['Impatto implacabile', 'Alimenta la frenesia'], col4: ['Lama vorticosa', 'Esca e scambia', 'Arma vorpal'] }
          ]
        },
        default: {
          label: 'Generico',
          combos: [
            { name: 'Sinergia Generica', col3: ['Fuorilegge', 'Ricostruzione', 'Demolitore', 'Proiettili a riavvolgimento', 'Assassino invidioso', 'Fondina auto-caricante'], col4: ['Frenesia', 'Esca e scambia', 'Carica esplosiva', 'Incandescente', 'Scarica voltaica', 'Colpo destabilizzante', 'Arma vorpal'] }
          ]
        }
      }
    }
  };
})(window);
