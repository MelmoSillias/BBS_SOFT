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

  // Initialisation de la table avec DataTables
  const exchangesTable = $('#exchangesTable').DataTable({
        "order": [[0, "desc"]], // Trier par la première colonne (Date) en ordre décroissant
        language: { url: '/api/datatable_json_fr' },
        "ajax": {   
            "url": `/api/client/${extractClientId()}/exchanges`,
            dataSrc: ''
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
            { "data": "date" },
            { "data": null, 
              "render": function(data, type, row) {
                    return `
                        ${row.fromAmount} ${row.fromCurrency}
                    `;
                }
             },
            { "data": "taux" },
            { "data": null,
              "render": function(data, type, row) {
                    return `
                        ${row.toAmount} ${row.toCurrency}
                    `;}
             },
            {
                "data": null,
                "render": function(data, type, row) {
                    return `
                        <button class="btn btn-info btn-sm view-btn text-white" data-id="${row.id}"> <i class="bi bi-eye"></i> </button>
                        <button class="btn btn-danger btn-sm delete-btn text-white" data-id="${row.id}"> <i class="bi bi-trash"></i>  </button>
                        <button class="btn btn-secondary btn-sm print-btn text-white" data-id="${row.id}"> <i class="bi bi-printer"></i>  </button>
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

  function chargeCurrencySolde(idClient, currency, input){ 
       $.get(`/api/client/${idClient}/stats/${currency}`, function(data) { 
            $(input).text(`${data.balance} ${currency}`);
        }).fail(function() {
            showToastModal({ message: 'Erreur lors de la récupération du solde.', type: 'error' });
        });
  }


// Fonction pour charger les soldes du client
function loadClientSoldes(clientId) {
  $.ajax({
    url: `/api/client/${clientId}/stats`,
    method: 'GET',
    success: function(response) {
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
        const balanceCard = `
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
        `;
        
        // Ajouter la carte au conteneur
        $('#clientBalances').append(balanceCard);
      }
    },
    error: function(xhr, status, error) {
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

// Gestion des événements pour les boutons "Voir"
// Gestion des événements pour les boutons "Voir"
$('#exchangesTable tbody').on('click', '.view-btn', function() {
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
    
 
    
    // Afficher le modal
    $('#exchangeDetailModal').modal('show');
});

// Gestion des événements pour les boutons "Supprimer"
$('#exchangesTable tbody').on('click', '.delete-btn', function() {
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
  $('#exchangesTable tbody').on('click', '.delete-btn', function() {
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
  $('#confirm-delete-btn').on('click', function() {
      if (exchangeToDelete) {
          // Effectuer la suppression via AJAX
          $.ajax({
              url: `/api/exchanges/${exchangeToDelete}`,
              method: 'DELETE',
              success: function(response) {
                  // Recharger le tableau
                  loadClientSoldes(extractClientId())
                  exchangesTable.ajax.reload();
                  // Afficher un message de succès
                  showToastModal({ message: 'Échange supprimé avec succès.', type: 'success' });
              },
              error: function(xhr, status, error) {
                  showToastModal({ message: "Erreur lors de la suppresion", type: 'error' })
              },
              complete: function() {
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
  $('#exchangesTable tbody').on('click', '.print-btn', function() {
      var id = $(this).data('id');
      alert("Impression de l'échange avec l'ID : " + id);
      // Ajoutez ici la logique pour imprimer
  });

  // Imprimer depuis le modal de détails
  $('#detail-print-btn').on('click', function() {
      window.print();
  });
}

 $('#btnExchange , #btnExchangeFloat').on('click', function(e) {
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
    $('#fromCurrency, #toCurrency').change(function() {
        const fromCurrency = $('#fromCurrency').val();
        const toCurrency = $('#toCurrency').val();

        if (fromCurrency && toCurrency && fromCurrency === toCurrency) {
            alert("Vous ne pouvez pas choisir la même devise de départ et d'arrivée.");
            $(this).val('');
        }
    });

   // Calcul automatique du montant converti et affichage du taux de change
  $('#fromAmount, #exchangeRate').on('input', function() {
      const amount = parseFloat($('#fromAmount').val());
      const rate = parseFloat($('#exchangeRate').val());

      if (!isNaN(amount) && !isNaN(rate)) {
          const convertedAmount = amount * rate;
          $('#toAmount').val(convertedAmount.toFixed(2));
      }
  });

  // Mettre à jour le taux de change affiché lorsque les devises changent
  $('#fromCurrency, #toCurrency').change(function() {
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
    $('#fromCurrency').on('change', function() {
        const currency = $(this).find(':selected').val();
        const clientId = $('#exchangeClientId').val();
        console.log(currency, clientId)
        if (currency && clientId) { 
           chargeCurrencySolde(clientId, currency, '#currentBalance')
        }
    });

    // Gérer l'échange de devise
    $('#exchangeButton').click(function() {
        const fromCurrency = $('#fromCurrency').val();
        const toCurrency = $('#toCurrency').val();
        const fromAmount = $('#fromAmount').val();
        const toAmount = $('#toAmount').val();
        const clientId = $('#exchangeClientId').val();

        if (!fromCurrency || !toCurrency || !fromAmount || !toAmount) {
            showToastModal({message : "Veuillez remplir tous les champs.", type : 'warning'});
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
      url: `/api/client/${clientId}/transferts`,
      dataSrc: '',
      data: function (d) {
        // Ajout des paramètres de filtre à la requête
        d.status = $('#filterStatus').val();
        d.type = $('#filterType').val();
        d.dateFrom = startTransfertDate;
        d.dateTo = endTransfertDate;
      }
    },
    columns: [
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
        render: function (data, type, row) { 
                        return `
                                    <div class="fw-bold">${data}</div>
                                    <small class="text-muted">${row.receiverPhone}</small>
                                `; 
                }
      },
      {
        data: 'montantCash',
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
          const total = parseFloat(row.montantCash) + parseFloat(row.frais);
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
        title: 'Liste des clients',
        exportOptions: { columns: [0, 1, 2, 3] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Liste des transferts',
        exportOptions: { columns: [0, 1, 2, 3] },
        customize: function (doc) {
          doc.content[1].table.widths = ['*', '*', '*', '*'];
          doc.content[1].table.body[0].forEach(cell => {
            cell.fillColor = '#007bff';
            cell.color = '#ffffff';
          });
        }
      }
    ],
    language: { url: '/api/datatable_json_fr' },
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
        chargerStatsTransferts();
      });
    }
  });


  $('#btnAddTransfert , #btnAddTransfertFloat').on('click', () => $('#modalAddTransfert').modal('show'));
  // Initialiser la date avec la date du jour
  $('#dateOps').val(new Date().toISOString().split('T')[0]);

  // Gestion du changement de destination
  $('#destination').change(function () {
    const destination = $(this).find(':selected').val();

    // Mettre à jour les affichages de devise
    $('#deviseRecueDisplay').text(countryCodeCurrency[destination].currency);
    $('#nomDeviseReceptionTaux').html(
      `
                ${countryCodeCurrency[destination].currencyName}
                              <span class="text-danger">*</span>
                `
    );
    $('#tauxReception').val(countryCodeCurrency[destination].USDValue)

    // Recalculer les montants
    calculerMontants();
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
    if (destination === 'EAU' && taux > 0) {
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

    const type = $('[name="type"]').val();

    // Préparation des données
    const formData = {
      date: $('#dateOps').val(),
      type: $('#typeOps').val(),
      destination: $('#destination').val(),
      expediteur: clientId,
      nomBeneficiaire: $('#nomBeneficiaire').val(),
      phoneBeneficiaire: $('#phoneBeneficiaire').val(),
      montantCash: $('#montantCash').val(),
      fraisEnvoi: $('#fraisEnvoi').val(),
      taux: $('#taux').val(),
      montantRecu: $('#montantRecu').val(),
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
        tableTransfers.reload()
        calculerMontants();
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
      $('#transferDestination').text(countryCodeCurrency[data.destination]['capital'] + ' - ' + countryCodeCurrency[data.destination]['countryName']);

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
      $('#transferAmount').text(data.montantCash.toLocaleString('fr-FR') + ' F CFA');
      $('#transferFees').text(data.frais.toLocaleString('fr-FR') + ' F CFA');
      $('#transferRate').text('1 USD = ' + data.taux.toLocaleString('fr-FR') + ' F CFA');
      $('#transferAmountUSD').text((data.montantCash / data.taux).toLocaleString('fr-FR') + ' USD');
      $('#deviseDestination').text(countryCodeCurrency[data.destination]['currencyName']);
      $('#destinationRate').text('1 USD = ' + data.tauxDeviseReception.toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination]['currency']);
      $('#destinationAmount').text((data.montantCash / data.taux * data.tauxDeviseReception).toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination]['currency']);

      const total = parseFloat(data.montantCash) + parseFloat(data.frais);
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
    }, 3000); // Réactiver après 3 secondes
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

    $.post('/api/transferts/' + transferId + '/validate', function () {
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
            success: function(data) {
                $('#stat-total').text(data.nombre_total ?? 0);
                $('#stat-valide').text(data.par_statut?.valide ?? 0);
                $('#stat-attente').text(data.par_statut?.en_attente ?? 0);
                $('#stat-annule').text(data.par_statut?.annule ?? 0); 

                $('#stat-montant').text(formatMontant(data.montant_total_cash ?? 0));
                $('#stat-recu').text(formatMontant(data.montant_total_reception ?? 0));
                $('#stat-frais').text(formatMontant(data.frais_totaux ?? 0));
            },
            error: function(xhr, status, error) {
                console.error('Erreur chargement statistiques:', error);
                showToastModal({ message: 'Erreur de connexion', type: 'error' });
            }
        });
    }

  calculerMontants();
  chargerStatsTransferts();
} 

/** Initialise la DataTable des transactions */
function initTransactions(clientId) {
  $('#filterTransactionType').on('change', () => transactionsTable.ajax.reload());

  const transactionsTable = $('#transactionsTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Transactions client',
        exportOptions: { columns: [0, 1, 2, 3] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Transactions client',
        exportOptions: { columns: [0, 1, 2, 3] }
      }
    ],
    ajax: {
      url: `/api/client/${clientId}/transactions`,
      data: d => { d.type = $('#filterTransactionType').val(); }
    },
    columns: [
      { data: 'date' },
      {
        data: 'type',
        render: function (data) {
          if (data === 'entrée') return `<span class="badge bg-success">${data}</span>`;
          if (data === 'sortie') return `<span class="badge bg-danger">${data}</span>`;
          return `<span class="badge bg-secondary">${data}</span>`;
        }
      },
      { data: 'amount', render: d => parseFloat(d).toLocaleString() },
      { data: 'devise' },
      { data: 'description' }
    ],
    order: [[0, 'desc']],
    language: { url: '/api/datatable_json_fr' }
  });

 
    
$('#form-edit-client').on('submit', function(e) {
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

  $('#btnAccompte').on('click', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = extractClientId() ;
    $('#accompteClientId').val(id);
    $('#accompteAmount, #accompteNote, #accompteMode, #accompteReference').val('');
    $('#accompteDate').val(new Date().toISOString().slice(0, 10));
    const currency = $('#deviseA').find(':selected').val()
    chargeCurrencySolde(id, currency, '#soldeDeviseA')
    $('#modalAccompteClient').modal('show');
    $btn.prop('disabled', false);
  });

   $('#deviseA').change(function() {
        const currency = $(this).find(':selected').val();
        const clientId = $('#accompteClientId').val();

        if (currency && clientId) {
            // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
           chargeCurrencySolde(clientId, currency, '#soldeDeviseA')
        }
    });

  $('#form-accompte-client').on('submit', function(e) {
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
      .done(() => {
        showToastModal({ message: 'Accompte enregistré !', type: 'success' });
        $('#modalAccompteClient').modal('hide');
        loadClientSoldes(extractClientId())
                  exchangesTable.ajax.reload();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur enregistrement acompte';
        showToastModal({ message: msg, type: 'error' });
      })
      .always(() => $btn.prop('disabled', false));
  });

  $('#btnWithdraw').on('click', function(e) {
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

  $('#deviseW').change(function() {
        const currency = $(this).find(':selected').val();
        const clientId = $('#withdrawClientId').val();

        if (currency && clientId) {
            // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
           chargeCurrencySolde(clientId, currency, '#soldeDeviseW')
        }
    });

  $('#form-withdraw-client').on('submit', function(e) {
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
      .done(() => {
        showToastModal({ message: 'Retrait effectué !', type: 'success' });
        $('#modalWithdrawClient').modal('hide');
        loadClientSoldes(extractClientId())
        exchangesTable.ajax.reload();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
        showToastModal({ message: msg, type: 'error' });
      })
      .always(() => $btn.prop('disabled', false));
  });

}
