// assets/clients/js/client_show.js
const countryCodeCurrency = {
  'EAU': { code: "EAU", countryName: "Émirats Arabes Unis", capital: "Abou Dabi", currency: "AED", currencyName: "Dirham des Émirats Arabes Unis", USDValue: 3.67 },
  'FR': { code: "FR", countryName: "France", capital: "Paris", currency: "EUR", currencyName: "Euro", USDValue: 0.93 },
  'USA': { code: "USA", countryName: "États-Unis", capital: "Washington, D.C.", currency: "USD", currencyName: "Dollar américain", USDValue: 1.00 },
  'UK': { code: "UK", countryName: "Royaume-Uni", capital: "Londres", currency: "GBP", currencyName: "Livre sterling", USDValue: 0.80 },
  'CHI': { code: "CHI", countryName: "Chine", capital: "Pékin", currency: "CNY", currencyName: "Yuan chinois", USDValue: 7.24 },
  'MRC': { code: "MRC", countryName: "Maroc", capital: "Rabat", currency: "MAD", currencyName: "Dirham marocain", USDValue: 10.03 },
  'ALG': { code: "ALG", countryName: "Algérie", capital: "Alger", currency: "DZD", currencyName: "Dinar algérien", USDValue: 133.40 }
};

const $destination = $('#destinationEchange');
const $typeOps = $('#typeOpsEchange');
const $deviseExchange = $('#deviseExchange');
const $montant = $('#montantEchange');
const $taux = $('#tauxEchange');
const $deviseAgenceDisplay = $('#deviseAgenceDisplayEchange');
const $devise = $('#deviseEchange');
const $totalAPayer = $('#totalAPayerEchange');
const $exchangeButton = $('#exchangeButton');


// Initialisation de la table avec DataTables
const exchangesTable = $('#exchangesTable').DataTable({
  "order": [[0, "desc"]], // Trier par la première colonne (Date) en ordre décroissant
  language: { url: '/api/datatable_json_fr' },
  "ajax": {
    "url": `/api/client/${extractClientId()}/exchanges`,
    "dataSrc": ""
  },
  "dom": 'Bfrtip', // Ajouter les boutons d'exportation
  "buttons": [
    {
      extend: 'excelHtml5',
      text: 'Exporter en Excel',
      title: 'Liste_des_Échanges'
    },
    {
      extend: 'pdfHtml5',
      text: 'Exporter en PDF',
      title: 'Liste_des_Échanges'
    },
    {
      extend: 'print',
      text: 'Imprimer',
      title: 'Liste_des_Échanges'
    }
  ],
  "columns": [
    {
      "data": "date",
      "render": function (data, type, row) {
        // Formater la date pour un affichage plus lisible
        return new Date(data).toLocaleString('fr-FR');
      }
    },
    {
      "data": "type",
      "render": function (data, type, row) {
        // Afficher le type d'opération (achat/vente)
        return data.charAt(0).toUpperCase() + data.slice(1);
      }
    },
    {
      "data": null,
      "render": function (data, type, row) {
        // Afficher le montant en devise
        return `${row.montantDevise} ${row.devise}`;
      }
    },
    {
      "data": null,
      "render": function (data, type, row) {
        // Afficher le montant en CFA
        return `${row.montantCFA} CFA`;
      }
    },
    {
      "data": "taux",
      "render": function (data, type, row) {
        // Formater le taux
        return parseFloat(data).toFixed(4);
      }
    },
    {
      "data": null,
      "render": function (data, type, row) {
        // Boutons d'action
        return `
                    <button class="btn btn-info btn-sm view-btn text-white" data-id="${row.id}"> 
                        <i class="bi bi-eye"></i> 
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn text-white" data-id="${row.id}"> 
                        <i class="bi bi-trash"></i>  
                    </button>
                    <button class="btn btn-secondary btn-sm print-btn text-white" data-id="${row.id}"> 
                        <i class="bi bi-printer"></i>  
                    </button>
                `;
      }
    }
  ]
});

$(document).ready(function () {
  const clientId = extractClientId();

  // 1. Charger infos de base & stats
  loadClientSoldes(clientId);
  // 4. Transactions
  initTransactions(clientId);
  initTranferts(clientId);
});


/** Extrait l'ID client depuis l'URL : /client/{id}/... */
function extractClientId() {
  const parts = window.location.pathname.split('/');
  const idx = parts.indexOf('client');
  return (idx >= 0 && parts.length > idx + 1) ? parts[idx + 1] : null;
}

function chargeCurrencySolde(idClient, currency, input) {
  $.get(`/api/client/${idClient}/stats/${currency}`, function (data) {
    $(input).text(`${data.balance} ${currency}`);
  }).fail(function () {
    showToastModal({ message: 'Erreur lors de la récupération du solde.', type: 'error' });
  });
}


// Fonction pour charger les soldes du client
function loadClientSoldes(clientId) {
  $.ajax({
    url: `/api/client/${clientId}/stats`,
    method: 'GET',
    success: function (response) {
      // Supprimer l'indicateur de chargement
      $('#clientBalances').empty();

      // Parcourir toutes les devises dans la réponse
      for (const [currencyCode, amount] of Object.entries(response)) {
        // Trouver les informations de la devise

        let currencyInfo = null;
        for (const country in countryCodeCurrency) {
          if (countryCodeCurrency[country].currency === currencyCode) {
            currencyInfo = countryCodeCurrency[country];
            break;
          }
        }

        // Si nous n'avons pas d'info, utiliser des valeurs par défaut
        if (!currencyInfo) {
          currencyInfo = {
            currency: currencyCode,
            currencyName: currencyCode,
            countryName: "Non spécifié",
            USDValue: 1
          };
        }

        // Calculer l'équivalent en USD
        const usdEquivalent = (amount * currencyInfo.USDValue).toFixed(2);

        // Générer le code HTML pour cette devise
        const balanceCard = currencyCode == "CFA" ? `
          <div class="col-md-3 col-sm-6 mb-4">
            <div class="card balance-card border-0">
              <div class="card-body">
                <div class="d-flex align-items-center mb-3"> 
                  <div>
                    <div class="balance-currency">${currencyInfo.currencyName}</div>
                    <div class="balance-amount text-primary">${formatCurrency(amount, currencyCode)}</div>
                  </div>
                </div> 
                <div class="d-flex justify-content-between align-items-center mt-2">
                  <span class="balance-trend bg-light text-dark">
                    <i class="bi bi-arrow-up-right text-success"></i> ${currencyInfo.currency}
                  </span> 
                </div>
              </div>
            </div>
          </div>
        ` : ``;

        // Ajouter la carte au conteneur
        $('#clientBalances').append(balanceCard);
      }
    },
    error: function (xhr, status, error) {
      $('#clientBalances').html(`
        <div class="col-12 text-center py-4">
          <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
          <p class="mt-2">Erreur lors du chargement des soldes</p>
          <button class="btn btn-sm btn-primary mt-2" onclick="loadClientSoldes(${clientId})">Réessayer</button>
        </div>
      `);
    }
  });


  let exchangeToDelete = null;
  let selectedExchange = null;

  // Gestion des événements pour les boutons "Voir"
  // Gestion des événements pour les boutons "Voir"
  $('#exchangesTable tbody').on('click', '.view-btn', function () {
    let tr = $(this).closest('tr');
    let row = exchangesTable.row(tr);
    let exchangeData = row.data();

    // Remplir le modal avec les données
    $('#detail-from-amount').text(exchangeData.fromAmount);
    $('#detail-from-currency').text(exchangeData.fromCurrency);
    $('#detail-to-amount').text(exchangeData.toAmount);
    $('#detail-to-currency').text(exchangeData.toCurrency);
    $('#detail-date').text(formatDate(exchangeData.date));
    $('#detail-taux').text(exchangeData.taux);
    $('#detail-reference').text("EX-" + exchangeData.id.toString().padStart(5, '0'));
    $('#detail-status').text("Complété");
    $('#detail-notes').text("Échange standard effectué sans problème.");


    selectedExchange = exchangeData.id
    // Afficher le modal
    $('#exchangeDetailModal').modal('show');
  });

  // Gestion des événements pour les boutons "Supprimer"
  $('#exchangesTable tbody').on('click', '.delete-btn', function () {
    let tr = $(this).closest('tr');
    let row = exchangesTable.row(tr);
    let exchangeData = row.data();
    exchangeToDelete = exchangeData.id;

    // Remplir le modal de confirmation
    $('#delete-reference').text("EX-" + exchangeData.id.toString().padStart(5, '0'));
    $('#delete-date').text(formatDate(exchangeData.date));
    $('#delete-amount').text(`${exchangeData.fromAmount} ${exchangeData.fromCurrency}`);

    // Afficher le modal de confirmation
    $('#deleteConfirmModal').modal('show');
  });

  // Gestion des événements pour les boutons "Supprimer"
  $('#exchangesTable tbody').on('click', '.delete-btn', function () {
    let id = $(this).data('id');
    exchangeToDelete = id;

    let tr = $(this).closest('tr');
    let row = exchangesTable.row(tr);
    let exchangeData = row.data();
    exchangeToDelete = exchangeData.id;

    // Remplir le modal de confirmation
    $('#delete-reference').text(exchangeData.reference);
    $('#delete-date').text(formatDate(exchangeData.date));
    $('#delete-amount').text(`${exchangeData.fromAmount} ${exchangeData.fromCurrency}`);

    // Afficher le modal de confirmation
    $('#deleteConfirmModal').modal('show');
  });

  // Confirmation de suppression
  $('#confirm-delete-btn').on('click', function () {
    if (exchangeToDelete) {
      // Effectuer la suppression via AJAX
      $.ajax({
        url: `/api/exchanges/${exchangeToDelete}`,
        method: 'DELETE',
        success: function (response) {
          // Recharger le tableau
          loadClientSoldes(extractClientId())
          exchangesTable.ajax.reload();
          // Afficher un message de succès
          showToastModal({ message: 'Échange supprimé avec succès.', type: 'success' });
        },
        error: function (xhr, status, error) {
          showToastModal({ message: "Erreur lors de la suppresion", type: 'error' })
        },
        complete: function () {
          // Fermer le modal
          $('#deleteConfirmModal').modal('hide');
          exchangeToDelete = null;
        }
      });
    }
  });

  // Fonction pour formater la date
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }


  // Gestion des événements pour les boutons "Imprimer"
  $('#exchangesTable tbody').on('click', '.print-btn', function () {
    var id = $(this).data('id');
    window.open(`/api/exchanges/${id}/print`, '_blank');
    // Ajoutez ici la logique pour imprimer
  });

  // Imprimer depuis le modal de détails
  $('#detail-print-btn').on('click', function () {
    let id = selectedExchange;
    window.open(`/api/exchanges/${id}/print`, '_blank');
  });
}

$('#btnExchange , #btnExchangeFloat').on('click', function (e) {
  e.preventDefault();
  const $btn = $(this);
  if ($btn.prop('disabled')) return;
  $btn.prop('disabled', true);

  $('#exchangeClientId').val(extractClientId());
  $('#fromCurrency, #toCurrency').val('');
  $('#fromAmount, #toAmount').val('');
  $('#exchangeRate').text(''); // Clear the exchange rate display

  $('#currencyModal').modal('show');
  $btn.prop('disabled', false);
});

// Empêcher la sélection de la même devise pour le départ et l'arrivée
$('#fromCurrency, #toCurrency').change(function () {
  const fromCurrency = $('#fromCurrency').val();
  const toCurrency = $('#toCurrency').val();

  if (fromCurrency && toCurrency && fromCurrency === toCurrency) {
    alert("Vous ne pouvez pas choisir la même devise de départ et d'arrivée.");
    $(this).val('');
  }
});

// Calcul automatique du montant converti et affichage du taux de change
$('#fromAmount, #exchangeRate').on('input', function () {
  const amount = parseFloat($('#fromAmount').val());
  const rate = parseFloat($('#exchangeRate').val());

  if (!isNaN(amount) && !isNaN(rate)) {
    const convertedAmount = amount * rate;
    $('#toAmount').val(convertedAmount.toFixed(2));
  }
});

// Mettre à jour le taux de change affiché lorsque les devises changent
$('#fromCurrency, #toCurrency').change(function () {
  const fromCurrency = $('#fromCurrency').val();
  const toCurrency = $('#toCurrency').val();

  if (fromCurrency && toCurrency) {
    // Vous pouvez récupérer le taux de change par défaut depuis une API ici si nécessaire
    // Pour l'instant, nous allons simplement afficher un message indiquant que le taux doit être saisi manuellement
    $('#exchangeRate').val(''); // Efface le taux actuel
    $('#toAmount').val(''); // Efface le montant converti
  }
});


// Récupérer et afficher le solde actuel
$('#fromCurrency').on('change', function () {
  const currency = $(this).find(':selected').val();
  const clientId = $('#exchangeClientId').val();
  console.log(currency, clientId)
  if (currency && clientId) {
    chargeCurrencySolde(clientId, currency, '#currentBalance')
  }
});

// Gérer l'échange de devise
$('#exchangeButton').click(function () {
  const fromCurrency = $('#fromCurrency').val();
  const toCurrency = $('#toCurrency').val();
  const fromAmount = $('#fromAmount').val();
  const toAmount = $('#toAmount').val();
  const clientId = $('#exchangeClientId').val();

  if (!fromCurrency || !toCurrency || !fromAmount || !toAmount) {
    showToastModal({ message: "Veuillez remplir tous les champs.", type: 'warning' });
    return;
  }

  const payload = {
    fromCurrency: fromCurrency,
    toCurrency: toCurrency,
    fromAmount: fromAmount,
    toAmount: toAmount
  };

  // Remplacez cette URL par l'endpoint de votre API pour effectuer l'échange de devise
  $.post(`/api/client/${clientId}/exchange`, payload)
    .done(() => {
      $('#currencyModal').modal('hide');
      showToastModal({ message: "échange de devise éffectué.", type: 'success' });
      loadClientSoldes(extractClientId())
      exchangesTable.ajax.reload();
    })
    .fail(() => {
      showToastModal({ message: "Erreur lors de l'échange de devise.", type: 'error' });
    });
});

// Fonction utilitaire pour formater les montants selon la devise
function formatCurrency(amount, currencyCode) {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2
  });

  return formatter.format(amount);
}

/** Initialise la section Factures ponctuelles */
function initTranferts(clientId) {

  let transferId;
  let startTransfertDate;
  let endTransfertDate;

  $('#filterDateRange').daterangepicker({
    locale: {
      format: 'YYYY-MM-DD',
      applyLabel: 'Appliquer',
      cancelLabel: 'Annuler',
      daysOfWeek: [
        'Di',
        'Lu',
        'Ma',
        'Me',
        'Je',
        'Ve',
        'Sa'
      ],
      monthNames: [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre'
      ],
      firstDay: 1
    },
    opens: 'left',
    alwaysShowCalendars: true,
    ranges: {
      "Aujourd'hui": [
        moment(), moment()
      ],
      "Hier": [
        moment().subtract(1, 'days'),
        moment().subtract(1, 'days')
      ],
      "Cette semaine": [
        moment().startOf('week'), moment().endOf('week')
      ],
      "Ce mois-ci": [
        moment().startOf('month'), moment().endOf('month')
      ],
      "Cette année": [moment().startOf('year'), moment().endOf('year')]
    },
    opens: 'right',
    autoUpdateInput: false
  });

  // Mettre à jour les champs cachés avec les dates sélectionnées
  $('#filterDateRange').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    startTransfertDate = picker.startDate.format('YYYY-MM-DD');
    endTransfertDate = picker.endDate.format('YYYY-MM-DD');

    // Recharger la table avec les nouvelles dates
    tableTransfers.ajax.reload();
    chargerStatsTransferts();
  });

  $('#filterDateRange').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    startTransfertDate = null;
    endTransfertDate = null;

    // Recharger la table avec les dates effacées
    tableTransfers.ajax.reload();
    chargerStatsTransferts();
  });

  const tableTransfers = $('#transfersTable').DataTable({
    ajax: {
      url: `/api/client/${extractClientId()}/transferts`,
      dataSrc: '',
      data: function (d) {
        // Ajout des paramètres de filtre à la requête
        d.status = $('#filterStatus').val();
        d.type = $('#filterType').val();
        d.clientType = $('#filterClientType').val();
        d.dateFrom = startTransfertDate;
        d.dateTo = endTransfertDate;
      }
    },
    columns: [
      {
        data: 'createdAt',
        visible: false,
      },
      {
        data: 'type',
        render: function (data) {
          const types = {
            'standard': '<span class="badge bg-primary">Envoi Cash</span>',
            'byAccount': '<span class="badge bg-info">Retrait compte</span>'
          };
          return types[data] || data;
        }
      },
      {
        data: 'receiverName',
      },
      {
        data: 'montantCFA',
        render: function (data) {
          return `<span class="text-success fw-bold">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
        },
        className: 'text-end'
      },
      {
        data: 'taux',
        render: function (data) {
          return `<span class="text-primary">${parseFloat(data).toLocaleString('fr-FR')}</span>`;
        },
        className: 'text-end'
      },
      {
        data: 'frais',
        render: function (data) {
          return `<span class="text-danger">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
        },
        className: 'text-end'
      },
      {
        data: null,
        render: function (data, type, row) {
          const total = parseFloat(row.montantCFA) + parseFloat(row.frais);
          return `<span class="fw-bold">${total.toLocaleString('fr-FR')} F CFA</span>`;
        },
        className: 'text-end'
      },
      {
        data: 'status',
        render: function (data) {
          const statusMap = {
            'completed': { class: 'badge-completed', text: 'Complété', icon: 'check-circle' },
            'pending': { class: 'badge-pending', text: 'En attente', icon: 'hourglass' },
            'cancelled': { class: 'badge-cancelled', text: 'Annulé', icon: 'x-circle' },
            'processing': { class: 'badge-processing', text: 'En cours', icon: 'arrow-repeat' }
          };
          const status = statusMap[data] || { class: '', text: data, icon: '' };
          return `
                                    <span class="badge-status ${status.class}">
                                        <i class="bi bi-${status.icon} me-1"></i>${status.text}
                                    </span>
                                `;
        }
      },
      {
        data: null,
        render: function (data, type, row) {
          let actions = `
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-primary dropdown-toggle btn-table-action" type="button" data-bs-toggle="dropdown">
                                            <i class="bi bi-gear"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end">
                                            <li><a class="dropdown-item view-transfer" href="#" data-id="${row.id}" ><i class="bi bi-eye me-2"></i>Voir</a></li>
                                            <li><a class="dropdown-item print-transfer" href="#" data-id="${row.id}"><i class="bi bi-printer me-2"></i>Imprimer</a></li>
                                `;

          if (row.status === 'pending') {
            actions += `
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item validate-transfer" href="#" data-id="${row.id}"><i class="bi bi-check-circle me-2"></i>Valider</a></li>
                                        <li><a class="dropdown-item cancel-transfer" href="#" data-id="${row.id}"><i class="bi bi-x-circle me-2"></i>Annuler</a></li>
                                    `;
          }

          if (row.status !== 'completed') {
            actions += `
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item delete-transfer" href="#" data-id="${row.id}"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                                    `;
          }

          actions += `</ul></div>`;
          return actions;
        },
        orderable: false,
        className: 'text-center'
      }
    ],
    order: [[0, 'desc']],
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Liste des transferts',
        exportOptions: {
          columns: [0, 1, 2, 3, 4, 5, 6, 7],
          format: {
            body: function (data, row, column, node) {
              // Nettoyer le contenu HTML pour Excel
              if (column === 1) { // Type
                return $(data).text() || data;
              }
              if (column === 2) { // Expéditeur
                return $(data).find('.fw-bold').text() || data;
              }
              if (column === 3 || column === 5 || column === 6) { // Montant, Frais, Total
                return data.replace(' F CFA', '').replace(/\s/g, '');
              }
              if (column === 7) { // Statut
                return $(data).text().trim() || data;
              }
              return data;
            }
          }
        },
        customize: function (xlsx) {
          var sheet = xlsx.xl.worksheets['sheet1.xml'];

          // Modifier le style des en-têtes
          $('row:first c', sheet).attr('s', '2');
        }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Liste des transferts',
        exportOptions: {
          columns: [0, 1, 2, 3, 4, 5, 6, 7],
          format: {
            body: function (data, row, column, node) {
              // Nettoyer le contenu HTML pour PDF
              if (column === 1) { // Type
                return $(data).text() || data;
              }
              if (column === 2) { // Expéditeur
                return $(data).find('.fw-bold').text() || data;
              }
              if (column === 3 || column === 5 || column === 6) { // Montant, Frais, Total
                return data.replace(' F CFA', '').replace(/\s/g, '');
              }
              if (column === 7) { // Statut
                return $(data).text().trim() || data;
              }
              return data;
            }
          }
        },
        customize: function (doc) {
          // Structure simple pour le PDF
          doc.content[1].table.widths = ['*', '*', '*', '*', '*', '*', '*', '*'];
          doc.styles.tableHeader.fillColor = '#007bff';
          doc.styles.tableHeader.color = '#ffffff';
          doc.styles.tableHeader.alignment = 'center';

          // Personnaliser les cellules du corps
          doc.content[1].table.body.forEach(function (row, i) {
            if (i > 0) { // Ignorer l'en-tête
              // Alignement des colonnes numériques à droite
              row[3].alignment = 'right';
              row[4].alignment = 'right';
              row[5].alignment = 'right';
              row[6].alignment = 'right';
            }
          });

          // Ajouter "F CFA" aux montants
          for (var i = 1; i < doc.content[1].table.body.length; i++) {
            doc.content[1].table.body[i][3] = { text: doc.content[1].table.body[i][3] + ' F CFA', alignment: 'right' };
            doc.content[1].table.body[i][5] = { text: doc.content[1].table.body[i][5] + ' F CFA', alignment: 'right' };
            doc.content[1].table.body[i][6] = { text: doc.content[1].table.body[i][6] + ' F CFA', alignment: 'right' };
          }
        }
      }
    ],
    language: {
      url: '/api/datatable_json_fr'
    },
    initComplete: function () {
      // Ajout des filtres personnalisés
      $('#transfersTable_filter').prepend(`
                            <div class="btn-group ms-2">
                                <select id="filterStatus" class="form-select form-select-sm">
                                    <option value="">Tous statuts</option>
                                    <option value="completed">Complété</option>
                                    <option value="pending">En attente</option>
                                    <option value="cancelled">Annulé</option>
                                    <option value="processing">En cours</option>
                                </select>
                                <select id="filterType" class="form-select form-select-sm">
                                    <option value="">Tous types</option>
                                    <option value="standard">Envoi Cash</option>
                                    <option value="byAccount">Retrait compte</option>
                                </select>
                                <select id="filterClientType" class="form-select form-select-sm">
                                    <option value="">Tous clients</option>
                                    <option value="regular">Clients enregistrés</option>
                                    <option value="ephemeral">Clients éphémères</option>
                                </select>
                            </div>
                        `);

      // Écouteurs d'événements pour les filtres
      $('#filterStatus, #filterType, #filterClientType, #filterDateRange').on('change', function () {
        tableTransfers.ajax.reload();
        // chargerStatsTransferts(); 
      });
    }
  });


  $('#btnAddTransfert , #btnAddTransfertFloat').on('click', () => $('#modalAddTransfert').modal('show'));
  // Initialiser la date avec la date du jour
  $('#dateOps').val(new Date().toISOString().split('T')[0]);

  // Gestion du changement de destination
  $('#destination').change(function () {
    const destination = $(this).find(':selected').val();
    let abg
    $.get(`/api/agence/${destination}`,
      function (data, status) {
        abg = data['abg']
        // Mettre à jour les affichages de devise
        $('#deviseRecueDisplay').text(countryCodeCurrency[abg].currency);
        $('#nomDeviseReceptionTaux').html(
          `
                        ${countryCodeCurrency[abg].currencyName}
                                    <span class="text-danger">*</span>
                        `
        );
        $('#tauxReception').val(countryCodeCurrency[abg].USDValue)

        // Recalculer les montants
        calculerMontants();
      });
  });

  $("#resetForm").on('click', () => {
    $('#totalAPayer').text(0 + ' CFA');
  });

  // Calcul des montants
  function calculerMontants() {
    const montantCash = parseFloat($('#montantCash').val()) || 0;
    const fraisEnvoi = parseFloat($('#fraisEnvoi').val()) || 0;
    const taux = parseFloat($('#taux').val()) || 1;
    const destination = $('[name="destination"]').val();
    const tauxReception = $('#tauxReception').val();

    // Calcul du montant reçu
    let montantRecu = 0;
    if (montantCash > 0 && taux > 0) {
      montantRecu = montantCash / taux;
    }

    // Calcul du montant en Dirhams si destination est Dubaï
    let montantReception = 0;
    if (taux > 0) {
      montantReception = montantRecu * tauxReception;
    }

    // Calcul du total à payer
    const totalAPayer = montantCash + fraisEnvoi;

    // Mise à jour des champs
    $('#montantRecu').val(montantRecu.toFixed(2));
    $('#montantDeviseReception').val(montantReception.toFixed(2));
    $('#totalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
  }

  // Écouteurs pour le recalcul automatique
  $('#montantCash, #fraisEnvoi, #taux').on('input', calculerMontants);

  // Soumission du formulaire
  $('#form-add-transfer').submit(function (e) {
    e.preventDefault();

    const $form = $(this);
    const $btn = $form.find('button[type="submit"]');
    disableButton($btn)

    // Validation
    const type = $('[name="type"]').val();

    // Préparation des données
    const formData = {
      date: $('#dateOps').val(),
      type: $('#typeOpsT').val(),
      destination: $('#destination').val(),
      expediteur: clientId,
      nomBeneficiaire: $('#nomBeneficiaire').val(),
      phoneBeneficiaire: $('#phoneBeneficiaire').val(),
      montantCash: $('#montantCash').val(),
      fraisEnvoi: $('#fraisEnvoi').val(),
      taux: $('#taux').val(),
      montantUSD: $('#montantRecu').val(),
      tauxReception: $('#tauxReception').val(),
      montantDeviseReception: $('#montantDeviseReception').val(),
      totalAPayer: $('#totalAPayer').text()
    };

    // Envoi des données via AJAX
    $.ajax({
      url: '/api/transfert/create', // Remplacez par l'URL de votre endpoint
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(formData),
      success: function (response) {
        showToastModal({ message: 'Transfert crée avec succès', type: 'success' });
        // Réinitialisation du formulaire
        $('#form-add-transfer').trigger("reset");
        $('#select-expediteur').val(null).trigger('change');
        $('#new-client-section').addClass('d-none');
        tableTransfers.ajax.reload()
        calculerMontants();

        transferId = response.transfertId;
                setTimeout( () => {window.open('/api/transferts/' + transferId + '/receipt', '_blank')}, 2000 ) 
      },
      error: function (xhr, status, error) {
        showToastModal({ message: !error && error != "" ? error : "Erreur de connexion", type: 'error' })
      }
    });
  });
  // Ouvrir le modal avec les données du transfert
  function openViewTransferModal(transferId) {
    // Simulation de données - remplacer par un appel AJAX réel
    $.get('/api/transferts/' + transferId, function (data) {
      currentTransferData = data;

      // Remplir les informations générales
      $('#transferReference').text(data.reference);
      $('#transferDate').text(new Date(data.createdAt).toLocaleDateString());
      $('#transferType').html(data.type === 'standard' ?
        '<span class="badge bg-primary">Envoi Cash</span>' :
        '<span class="badge bg-info">Retrait compte</span>');
      $('#transferDestination').text(countryCodeCurrency[data.destination.abg]['capital'] + ' - ' + countryCodeCurrency[data.destination.abg]['countryName']);

      // Remplir le statut avec le badge approprié
      let statusBadge = '';
      switch (data.status) {
        case 'completed':
          statusBadge = '<span class="badge bg-success">Complété</span>';
          break;
        case 'pending':
          statusBadge = '<span class="badge bg-warning">En attente</span>';
          break;
        case 'cancelled':
          statusBadge = '<span class="badge bg-danger">Annulé</span>';
          break;
        default:
          statusBadge = '<span class="badge bg-secondary">' + data.status + '</span>';
      }
      $('#transferStatus').html(statusBadge);

      // Remplir les informations de l'expéditeur
      $('#senderName').text(data.expediteur);
      $('#senderPhone').text(data.phone || '--');
      $('#senderType').text(data.clientType === 'ephemeral' ? 'Client éphémère' : 'Client enregistré');
      $('#senderId').text(data.expediteurId || '--');

      // Remplir les informations du bénéficiaire
      $('#beneficiaryName').text(data.receiverName || '--');
      $('#beneficiaryPhone').text(data.receiverPhone || '--');

      // Remplir les montants
      $('#transferAmount').text(data.montantCFA.toLocaleString('fr-FR') + ' F CFA');
      $('#transferFees').text(data.frais.toLocaleString('fr-FR') + ' F CFA');
      $('#transferRate').text('1 USD = ' + data.taux.toLocaleString('fr-FR') + ' F CFA');
      $('#transferAmountUSD').text((data.montantUSD).toLocaleString('fr-FR') + ' USD');
      $('#deviseDestination').text(countryCodeCurrency[data.destination.abg]['currencyName']);
      $('#destinationRate').text('1 USD = ' + (destination.abg === "EAU" ? 3.67 : (data.montantReception / data.montantUSD).toLocaleString('fr-FR')) + ' ' + countryCodeCurrency[data.destination.abg]['currency']);
      $('#destinationAmount').text((data.montantReception).toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination.abg]['currency']);

      const total = parseFloat(data.montantCFA) + parseFloat(data.frais);
      $('#transferTotal').text(total.toLocaleString('fr-FR') + ' F CFA');

      // Afficher/masquer les boutons d'action selon le statut
      toggleActionButtons(data.status);

      // Afficher le modal
      $('#viewTransferModal').modal('show');
    }).fail(function () {
      showToastModal({ message: 'Erreur de connexion', type: 'error' });
    });
  }

  // Afficher/masquer les boutons d'action selon le statut
  function toggleActionButtons(status) {
    // Masquer tous les boutons d'abord
    $('#validateTransferBtn, #cancelTransferBtn, #deleteTransferBtn').addClass('d-none');

    // Afficher les boutons appropriés
    switch (status) {
      case 'pending':
        $('#validateTransferBtn, #cancelTransferBtn').removeClass('d-none');
        break;
      case 'cancelled':
        $('#deleteTransferBtn').removeClass('d-none');
        break;
      case 'completed':
        // Aucun bouton supplémentaire pour les transferts complétés
        break;
    }
  }
  // Fonction pour prévenir les doubles envois
  function disableButton(button) {
    button.prop('disabled', true);
    setTimeout(() => {
      button.prop('disabled', false);
    }, 10000); // Réactiver après 3 secondes
  }

  $('#validateTransferBtn').on('click', function () {
    transferId = currentTransferData.id;
    $('#confirmValidateModal').modal('show');
  });

  $('#cancelTransferBtn').on('click', function () {
    transferId = currentTransferData.id;
    $('#confirmCancelModal').modal('show');
  });

  $('#deleteTransferBtn').on('click', function () {
    transferId = currentTransferData.id;
    $('#confirmDeleteModal').modal('show');
  });


  // Écouteurs pour ouvrir les modales de confirmation
  $('#transfersTable').on('click', '.validate-transfer', function () {
    transferId = $(this).data('id');
    $('#valid-date').val(new Date().toISOString().split('T')[0])
    $('#confirmValidateModal').modal('show');
  });

  $('#transfersTable').on('click', '.cancel-transfer', function () {
    transferId = $(this).data('id');
    $('#confirmCancelModal').modal('show');
  });

  $('#transfersTable').on('click', '.delete-transfer', function () {
    transferId = $(this).data('id');
    $('#confirmDeleteModal').modal('show');
  });

  // Écouteurs pour les actions de confirmation
  $('#confirmValidate').click(function () {
    const button = $(this);
    disableButton(button);

    const valid_date = $('#valid-date').val()

    $.post('/api/transferts/' + transferId + '/validate/' + valid_date, function () {
      showToastModal({ message: 'Transfert validé avec succès!', type: 'success' });
      $('#confirmValidateModal').modal('hide');
      $('#viewTransferModal').modal('hide');
      tableTransfers.ajax.reload();
    }).fail(function () {
      showToastModal({ message: 'Erreur lors de la validation du transfert', type: 'error' });
    });
  });

  $('#confirmCancel').click(function () {
    const button = $(this);
    disableButton(button);

    $.post('/api/transferts/' + transferId + '/cancel', function () {
      showToastModal({ message: 'Transfert annulé avec succès!', type: 'success' });
      $('#confirmCancelModal').modal('hide');
      $('#viewTransferModal').modal('hide');
      tableTransfers.ajax.reload();
    }).fail(function () {
      showToastModal({ message: 'Erreur lors de l\'annulation du transfert', type: 'error' });
    });
  });

  $('#confirmDelete').click(function () {
    const button = $(this);
    disableButton(button);

    $.ajax({
      url: '/api/transferts/' + transferId + '/delete',
      type: 'DELETE',
      success: function () {
        showToastModal({ message: 'Transfert supprimé avec succès!', type: 'success' });
        $('#confirmDeleteModal').modal('hide');
        $('#viewTransferModal').modal('hide');
        tableTransfers.ajax.reload();
      },
      error: function () {
        showToastModal({ message: 'Erreur lors de la suppression du transfert', type: 'error' });
      }
    });
  });


  function formatMontant(valeur) {
    return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
  }

  // Écouteur pour l'impression du reçu
  $('#transfersTable').on('click', '.print-transfer', function () {
    transferId = $(this).data('id');
    window.open('/api/transferts/' + transferId + '/receipt', '_blank');
  });

  // Écouteur pour le téléchargement du reçu
  $('#transfersTable').on('click', '.download-transfer', function () {
    transferId = $(this).data('id');
    window.location.href = '/api/transferts/' + transferId + '/receipt?download=1';
  });

  // Écouteur pour ouvrir le modal de visualisation
  $('#transfersTable').on('click', '.view-transfer', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    openViewTransferModal(id);
  });

  function chargerStatsTransferts() {
    $.ajax({
      url: `/api/client/${clientId}/transferts/stats`,
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        $('#stat-total').text(data.nombre_total ?? 0);
        $('#stat-valide').text(data.par_statut?.valide ?? 0);
        $('#stat-attente').text(data.par_statut?.en_attente ?? 0);
        $('#stat-annule').text(data.par_statut?.annule ?? 0);

        $('#stat-montant').text(formatMontant(data.montant_total_cash ?? 0));
        $('#stat-recu').text(formatMontant(data.montant_total_reception ?? 0));
        $('#stat-frais').text(formatMontant(data.frais_totaux ?? 0));
      },
      error: function (xhr, status, error) {
        console.error('Erreur chargement statistiques:', error);
        showToastModal({ message: 'Erreur de connexion', type: 'error' });
      }
    });
  }

  calculerMontants();
  chargerStatsTransferts();
}

function initTransactions(clientId) {
  $('#filterTransactionType').on('change', () => transactionsTable.ajax.reload());
  $('#filterTransactionDate').daterangepicker({
    locale: {
      format: 'YYYY-MM-DD',
      applyLabel: 'Appliquer',
      cancelLabel: 'Annuler',
      daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
      monthNames: [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ],
      firstDay: 1
    },
    autoUpdateInput: false,
    opens: 'right'
  });

  let startTransactionDate = null;
  let endTransactionDate = null;

  $('#filterTransactionDate').on('apply.daterangepicker', function (ev, picker) {
    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    startTransactionDate = picker.startDate.format('YYYY-MM-DD');
    endTransactionDate = picker.endDate.format('YYYY-MM-DD');
    transactionsTable.ajax.reload();
  });

  $('#filterTransactionDate').on('cancel.daterangepicker', function (ev, picker) {
    $(this).val('');
    startTransactionDate = null;
    endTransactionDate = null;
    transactionsTable.ajax.reload();
  });

  const transactionsTable = $('#transactionsTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Transactions client',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Transactions client',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
      },
      {
        text: '<i class="bi bi-printer"></i> Imprimer',
        className: 'btn btn-primary',
        action: function (e, dt, node, config) {
          printTransactionReport(clientId);
        }
      }
    ],
    ajax: {
      url: `/api/client/${clientId}/transactions`,
      data: d => { d.type = $('#filterTransactionType').val(); d.dateFrom = startTransactionDate; d.dateTo = endTransactionDate; },
    },
    columns: [
      {
        data: 'id',
        title: 'Reference',
        render: (data) => { return 'BSS-C' + String(data).padStart(3, '0'); }
      },
      {
        data: 'date',
        title: 'Date',
        render: (data) => { return data.split(" ")[0]; }
      },
      {
        data: 'description',
        title: 'Description'
      },
      {
        data: 'amountCFA',
        title: 'CFA',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }
      },
      {
        data: 'amountAED',
        title: 'AED',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;

        }, visible: false,
      },
      {
        data: 'amountEUR',
        title: 'EUR',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: 'amountUSD',
        title: 'USD',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: 'amountGBP',
        title: 'GBP',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: 'amountCNY',
        title: 'CNY',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: 'amountMAD',
        title: 'MAD',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount > 0 ? amount.toLocaleString() : '--';
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: 'amountDZD',
        title: 'DZD',
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? 'text-danger' : 'text-success';
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        }, visible: false,
      },
      {
        data: null,
        title: 'Actions',
        render: function (data, type, row) {
          if (row.type === "Versement" || row.type === "Retrait") {
            return `
              <button class="btn btn-sm btn-outline-primary print-btn" data-id="${row.id}" title="Imprimer">
                <i class="bi bi-printer"></i>
              </button>
              <button class="btn btn-sm btn-outline-info modify-btn" data-id="${row.id}" title="Modifier">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${row.id}" title="Cancel">
                <i class="bi bi-x-circle"></i>
              </button>
            `;
          } else {
            return '';
          }
        },
        orderable: false,
      }
    ],
    order: [[0, 'desc']],
    language: { url: '/api/datatable_json_fr' }
  });



// Fonction d'impression du relevé de compte complet
function printTransactionReport(clientId) {
  // Récupérer les données du client et des transactions
  // Ajout des paramètres dateFrom et dateTo à la requête
  const dateFrom = startTransactionDate;
  const dateTo = endTransactionDate;

  Promise.all([
    fetch(`/api/client/${clientId}/smalldetails`).then(r => r.json()),
    fetch(`/api/client/${clientId}/transactions_report?dateFrom=${encodeURIComponent(dateFrom || '')}&dateTo=${encodeURIComponent(dateTo || '')}`).then(r => r.json())
  ]).then(([clientData, transactionsData]) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    const currentDate = new Date().toLocaleDateString('fr-FR');
    let transactionsHTML = ''; 
    const solde = transactionsData.solde;

    transactionsData.data.forEach(transaction => { 

      transactionsHTML += `
        <tr>
          <td>BSS-C${String(transaction.id).padStart(3, '0')}</td>
          <td>${transaction.date.split(' ')[0]}</td>
          <td>${transaction.description}</td>
          <td style="text-align: right;">${transaction.entree > 0 ? parseFloat(transaction.entree).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
          <td style="text-align: right;">${transaction.sortie > 0 ? parseFloat(transaction.sortie).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
          <td style="text-align: right;">${transaction.solde > 0 ? parseFloat(transaction.solde).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
        </tr>
      `;
    });

    // Déterminer la période à afficher
    let periodeText = '';
    if (!dateFrom && !dateTo) {
      periodeText = "Depuis le début";
    } else {
      periodeText = `Période du ${dateFrom || ''} au ${dateTo || ''}`;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
      <title>Relevé de Compte - ${clientData.nomComplet}</title>
      <meta charset="UTF-8">
      <style>
        @page {
        size: A5 portrait;
        margin: 30px;
        }
        body {
        font-family: Arial, sans-serif;
        font-size: 10px;
        margin: 0;
        padding: 0;
        line-height: 1.2;
        }
        .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 5px;
        border-bottom: 2px solid #000;
        padding-bottom: 5px;
        }
        .header img {
        width: 80px;
        height: auto;
        }
        .company-info {
        text-align: right;
        font-size: 9px;
        }
        .title {
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        margin: 5px 0 10px;
        text-transform: uppercase;
        }
        .client-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 9px;
        }
        .transaction-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8px;
        margin-bottom: 10px;
        }
        .transaction-table th,
        .transaction-table td {
        border: 1px solid #000;
        padding: 3px;
        text-align: left;
        }
        .transaction-table th {
        background-color: #f0f0f0;
        font-weight: bold;
        }
        .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        font-size: 9px;
        }
        .signature {
        text-align: center;
        margin-top: 20px;
        font-size: 9px;
        }
        .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
        }
      </style>
      </head>
      <body>
      <div class="header">
        <div class="logo">
        <img src="${window.location.origin}/assets/img/logo.png" alt="Logo">
        </div>
        <div class="company-info">
        <small>Billeterie-Change-Transaction-Commerce Général</small><br>
        BKO IMM. PETIT BAROU<br>
        Tél: (+223) - 66626317 - 76260611<br>
        DUBAI: (+971) - 55 426 2144
        </div>
      </div>
      
      <div class="title">
        RELEVÉ DE COMPTE<br>
        <small>${periodeText}</small>
      </div>
      
      <div class="client-info">
        <div>
        <strong>Client:</strong> ${clientData.nomComplet}<br>
        <strong>Téléphone:</strong> ${clientData.phoneNumber || 'Non renseigné'}
        </div>
        <div>
        <strong>Adresse:</strong> ${clientData.address || 'Non renseignée'}<br>
        <strong>Date d'édition:</strong> ${currentDate}
        </div>
      </div>
      
      <table class="transaction-table">
        <thead>
        <tr>
          <th width="10%">Référence</th>
          <th width="10%">Date</th>
          <th width="33%">Description</th>
          <th width="15%">Dépôt</th>
          <th width="15%">Retrait</th>
          <th width="17%">Solde</th>
        </tr>
        </thead>
        <tbody>
        ${transactionsHTML}
        <tr class="total-row">
          <td colspan="3">SOLDE FINAL</td>
          <td></td>
          <td></td>
          <td style="text-align: right;">${solde.toLocaleString()} F CFA</td>
        </tr>
        </tbody>
      </table>
      
      <div class="signature">
        <p>Signature et cachet de l'entreprise</p>
        <p style="margin-top: 20px;">_________________________________</p>
      </div>
      
      <div class="footer">
        <div>BSS Consulting - Système de gestion client</div>
        <div>Page 1/1</div>
      </div>
      
      <script>
        window.onload = function() {
        window.print();
        setTimeout(function() {
          window.close();
        }, 1000);
        };
      </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }).catch(error => {
    console.error('Erreur lors de la génération du rapport:', error);
    alert('Erreur lors de la génération du rapport d\'impression');
  });
}

transactionsTable.on('click', '.print-btn', function () {
  id = $(this).data('id');
  window.open(`/api/transaction/${id}/receipt`, '_blank');
});

let selectedTransactionID

transactionsTable.on('click', '.modify-btn', function () {
  selectedTransactionID = $(this).data('id');
  $.get(`/api/transaction/${selectedTransactionID}/details`, function (data) {
    $("#editTransDate").val(data.date)
    $("#editTransAmount").val(data.montant)
    $("#editTransType").val(data.type)
  })

  $("#editTransactionModal").modal('show')
});

$('#confirmEditTrans').on('click', () => {
  $(this).prop('disabled', true)
  $.post('/api/transaction/' + selectedTransactionID + '/update',
    {
      montant: $("#editTransAmount").val(),
      date: $("#editTransDate").val()
    },
    () => {
      transactionsTable.ajax.reload()
      $("#editTransactionModal").modal('hide')
      showToastModal({ message: "Transaction modifiée avec succès", type: "success" });
      $(this).prop('disabled', false);

    }
  ).fail(function () {
    showToastModal({ message: "Echec de modification", type: "error" });
    $(this).prop('disabled', false);
  })
}),

  transactionsTable.on('click', '.cancel-btn', function () {
    selectedTransactionID = $(this).data('id');
    console.log(selectedTransactionID);

    $("#confirmCancelTransactionModal").modal('show')
  });

$('#confirmCancelTransaction').on('click', () => {
  console.log(selectedTransactionID);
  $(this).prop('disabled', true)
  $.post('/api/transaction/' + selectedTransactionID + '/cancel', { id: selectedTransactionID },
    () => {
      transactionsTable.ajax.reload();
      $("#confirmCancelTransactionModal").modal('hide')
      showToastModal({ message: "Transaction supprimée avec succès", type: "success" });
      $(this).prop('disabled', false);
    }
  ).fail(function () {
    showToastModal({ message: "Echec de suppression", type: "error" });
    $(this).prop('disabled', false);
  })
}),

  $('#form-edit-client').on('submit', function (e) {
    e.preventDefault();
    const $form = $(this);
    const $btn = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $('#editClientId').val();
    const fd = new FormData(this);
    $.ajax({
      url: `/client/${id}/modify`,
      method: 'POST',
      data: fd,
      processData: false,
      contentType: false
    })
      .done(() => {
        showToastModal({ message: 'Client modifié avec succès !', type: 'success' });
        $('#modalEditClient').modal('hide');
        table.ajax.reload();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur modification client';
        showToastModal({ message: msg, type: 'error' });
      })
      .always(() => $btn.prop('disabled', false));
  });

$('#btnAccompte').on('click', function (e) {
  e.preventDefault();
  const $btn = $(this);
  if ($btn.prop('disabled')) return;
  $btn.prop('disabled', true);
  const id = extractClientId();
  $('#accompteClientId').val(id);
  $('#accompteAmount, #accompteNote, #accompteMode, #accompteReference').val('');
  $('#accompteDate').val(new Date().toISOString().slice(0, 10));
  const currency = $('#deviseA').find(':selected').val()
  chargeCurrencySolde(id, currency, '#soldeDeviseA')
  $('#modalAccompteClient').modal('show');
  $btn.prop('disabled', false);
});

$('#deviseA').change(function () {
  const currency = $(this).find(':selected').val();
  const clientId = $('#accompteClientId').val();

  if (currency && clientId) {
    // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
    chargeCurrencySolde(clientId, currency, '#soldeDeviseA')
  }
});

$('#form-accompte-client').on('submit', function (e) {
  e.preventDefault();
  const $form = $(this);
  const $btn = $form.find('button[type="submit"]');
  if ($btn.prop('disabled')) return;
  $btn.prop('disabled', true);
  const id = $('#accompteClientId').val();
  const payload = {
    amount: $('#accompteAmount').val(),
    note: $('#accompteNote').val(),
    date: $('#accompteDate').val(),
    mode: $('#accompteMode').val(),
    reference: $('#accompteReference').val(),
    currency: $('#deviseA').find(':selected').val()
  };
  $.post(`/dashboard/client/${id}/accompte`, payload) 
    .done(function(response, textStatus, jqXHR) {
        showToastModal({ message: 'Accompte enregistré !', type: 'success' });
        $('#modalAccompteClient').modal('hide');
        loadClientSoldes(extractClientId())
        exchangesTable.ajax.reload();
        transactionsTable.ajax.reload();
        loadStats();
        setTimeout(()=>{window.open(`/api/transaction/${response.id}/receipt`, '_blank');}, 2000)
    })
    .fail(xhr => {
      const msg = xhr.responseJSON?.message || 'Erreur enregistrement acompte';
      showToastModal({ message: msg, type: 'error' });
    })
    .always(() => $btn.prop('disabled', false));
});

$('#btnWithdraw').on('click', function (e) {
  e.preventDefault();
  const $btn = $(this);
  if ($btn.prop('disabled')) return;
  $btn.prop('disabled', true);
  const id = extractClientId();
  $('#withdrawClientId').val(id);
  $('#withdrawAmount, #withdrawNote, #withdrawMode, #withdrawReference').val('');
  $('#withdrawDate').val(new Date().toISOString().slice(0, 10));
  const currency = $('#deviseW').find(':selected').val()
  chargeCurrencySolde(id, currency, '#soldeDeviseW')
  $('#modalWithdrawClient').modal('show');
  $btn.prop('disabled', false);
});

$('#deviseW').change(function () {
  const currency = $(this).find(':selected').val();
  const clientId = $('#withdrawClientId').val();

  if (currency && clientId) {
    // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
    chargeCurrencySolde(clientId, currency, '#soldeDeviseW')
  }
});

$('#form-withdraw-client').on('submit', function (e) {
  e.preventDefault();
  const $form = $(this);
  const $btn = $form.find('button[type="submit"]');
  if ($btn.prop('disabled')) return;
  $btn.prop('disabled', true);
  const id = $('#withdrawClientId').val();
  const payload = {
    amount: $('#withdrawAmount').val(),
    note: $('#withdrawNote').val(),
    date: $('#withdrawDate').val(),
    mode: $('#withdrawMode').val(),
    reference: $('#withdrawReference').val(),
    currency: $('#deviseW').find(':selected').val()
  };
  $.post(`/dashboard/client/${id}/retrait`, payload)
    .done(function(response, textStatus, jqXHR) {
     showToastModal({ message: 'Retrait effectué !', type: 'success' });
      $('#modalWithdrawClient').modal('hide');
        loadClientSoldes(extractClientId())
        exchangesTable.ajax.reload();
        transactionsTable.ajax.reload();
        loadStats();
        setTimeout(()=>{window.open(`/api/transaction/${response.id}/receipt`, '_blank');}, 2000)
    })
    .fail(xhr => {
      const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
      showToastModal({ message: msg, type: 'error' });
    })
    .always(() => $btn.prop('disabled', false));
});

// Fonction pour mettre à jour l'interface en fonction de l'agence sélectionnée
function updateUIByAgency() {
  const selectedAgencyId = parseInt($destination.val());

  if (selectedAgencyId === 1) {
    // Agence d'id 1: tous les choix sont disponibles
    $typeOps.prop('disabled', false).prop('readonly', false);
    $deviseExchange.prop('disabled', false).prop('readonly', false);
  } else {
    // Autres agences: seulement vente et USD
    $typeOps.val('vente').prop('disabled', true).prop('readonly', true);
    $deviseExchange.val('USD').prop('disabled', true).prop('readonly', true);
  }

  // Mettre à jour l'affichage des devises
  updateDeviseDisplay();
}

// Fonction pour mettre à jour l'affichage des devises
function updateDeviseDisplay() {
  const selectedDevise = $deviseExchange.val();
  $deviseAgenceDisplay.text(selectedDevise);

  if ($typeOps.val() === 'achat') {
    $devise.text('CFA');
  } else {
    $devise.text(selectedDevise);
  }
}

// Fonction pour calculer le total
function calculateTotal() {
  const montant = parseFloat($montant.val()) || 0;
  const taux = parseFloat($taux.val()) || 0;
  const type = $typeOps.val();
  const devise = $deviseExchange.val();

  let total = 0;

  if (type === 'achat') {
    // Pour l'achat: montant en devise * taux = montant en CFA
    total = montant * taux;
    $totalAPayer.removeClass('text-success text-danger').addClass('text-danger');
    $totalAPayer.text(`-${total.toFixed(2)} CFA`);
  } else {
    // Pour la vente: montant en devise * taux = montant en CFA
    total = montant * taux;
    $totalAPayer.removeClass('text-success text-danger').addClass('text-success');
    $totalAPayer.text(`+${total.toFixed(2)} CFA`);
  }
}

// Événement lors du changement d'agence
$destination.on('change', function () {
  updateUIByAgency();
  calculateTotal();
});

// Événement lors du changement de type d'opération
$typeOps.on('change', function () {
  updateDeviseDisplay();
  calculateTotal();
});

// Événement lors du changement de devise
$deviseExchange.on('change', function () {
  updateDeviseDisplay();
  calculateTotal();
});

// Événements pour le calcul en temps réel
$montant.on('input', calculateTotal);
$taux.on('input', calculateTotal);

// Événement pour le bouton d'échange
$exchangeButton.on('click', function () {
  // Validation des champs
  if (!$montant.val() || !$taux.val()) {
    showToastModal({ message: 'Veuillez remplir tous les champs obligatoires.', type: "warning" });
    return;
  }

  // Récupération des données du formulaire
  const formData = {
    clientId: extractClientId(),
    destination: $destination.find(":selected").val(),
    type: $typeOps.val(),
    deviseExchange: $deviseExchange.val(),
    montant: $montant.val(),
    date: $("#dateOpsEchange").val(),
    taux: $taux.val(),
    note: $('#exchangeNote').val()
  };

  $.post(`/api/client/${formData.clientId}/exchange`, formData)
    .done(function(response, textStatus, jqXHR) {
                showToastModal({ message: `${formData.type} effectué avec succès !`, type: 'success' });
                table.ajax.reload();
                loadStats();
                setTimeout( () => {window.open('/api/exchanges/' + response.id + '/print', '_blank')}, 2000 ) 
    }).fail(() => {
      showToastModal({ message: "L'opération a echouée !", type: 'error' })
    })

  // Fermer le modal après traitement
  $('#currencyModal').modal('hide');
});



// Initialisation de l'interface au chargement
updateUIByAgency();
calculateTotal();

}
