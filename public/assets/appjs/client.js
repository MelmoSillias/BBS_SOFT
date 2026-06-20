$(document).ready(function() {
  // Éléments du DOM
  const $destination = $('#destination');
  const $typeOps = $('#typeOps');
  const $deviseExchange = $('#deviseExchange');
  const $montant = $('#montant');
  const $taux = $('#taux');
  const $deviseAgenceDisplay = $('#deviseAgenceDisplay');
  const $devise = $('#devise');
  const $totalAPayer = $('#totalAPayer');
  const $exchangeButton = $('#exchangeButton');


  const table = $('#clientsTable').DataTable({
    ajax: {
      url: '/api/clients',
      dataSrc: 'data'
    },
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
        title: 'Liste des clients',
        exportOptions: { columns: [0, 1, 2, 3] },
        customize: function(doc) {
          doc.content[1].table.widths = ['*', '*', '*', '*'];
          doc.content[1].table.body[0].forEach(cell => {
            cell.fillColor = '#007bff';
            cell.color = '#ffffff';
          });
        }
      }
    ],
    columns: [
	{ data: 'id'},
      { data: 'nomComplet' },
      { data: 'phoneNumber' },
      { data: 'balanceCFA',
                render: function (data) {
                    return `<span class="${ data >= 0 ? 'text-primary' : 'text-danger'} fw-bold" style='font-size:18px'>${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                }, },
      { data: 'balanceUSD', render: d => parseFloat(d).toLocaleString(), visible:false },
      { data: 'balanceEUR', render: d => parseFloat(d).toLocaleString(), visible:false },
      { data: 'id', orderable: false, render: renderActions },
    ],
    language: { url: '/api/datatable_json_fr' },
    order: [[1, 'asc']],
  });

  function renderActions(id) {
    return `
      <button class="btn btn-sm btn-info modify" data-id="${id}" title="Modifier">
        <i class="bi bi-pencil-square"></i>
      </button> 
      <a href="/dashboard/client/${id}/details" class="btn btn-sm btn-secondary details" data-id="${id}">
        <i class="bi bi-info-circle"></i>
      </a>
      <button class="btn btn-sm btn-success accompte" data-id="${id}" title="Accompte">
        <i class="bi bi-wallet2"></i>
      </button>
      <button class="btn btn-sm btn-warning withdraw" data-id="${id}" title="Retrait">
        <i class="bi bi-paypal"></i>
      </button>
      <button class="btn btn-sm btn-primary exchange" data-id="${id}" title="Echanger">
        <i class="bi bi-currency-exchange"></i>
      </button>
      <button class="btn btn-sm btn-dark transfert-interclient" data-id="${id}" title="transfert-intercompte">
        <i class="bi bi-arrow-left-right"></i>
      </button>
    `;
  }

  function loadStats() {
    $.get('/api/clients/stats', stats => {
      $('#stats').html(`
        <div class="col-lg-4">
          <div class="small-box bg-primary">
            <div class="inner"><h3>${stats.total}</h3><p>Clients au total</p></div>
            <div class="icon"><i class="bi bi-people-fill"></i></div>
          </div>
        </div>
      `);
    });
  }

  $('#form-ajout-client').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    $.post('/api/client/add', $form.serialize())
      .done(() => {
        showToastModal({ message: 'Client ajouté avec succès!', type: 'success' });
        $form[0].reset();
        loadStats();
        table.ajax.reload();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur ajout client';
        showToastModal({ message: msg, type: 'error' });
      })
      .always(() => {
        $btn.prop('disabled', false);
      });
  });

  $('#clientsTable tbody').on('click', '.details', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $btn.data('id');
    $('#modalActionContent').load(`/client/${id}/details`, () => {
      $('#modalAction').modal('show');
      $btn.prop('disabled', false);
    });
  });

  $('#clientsTable tbody').on('click', '.modify', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $btn.data('id');
    $.get(`/api/client/${id}/smalldetails`)
      .done(details => {
        $('#editClientId').val(details.id);
        $('#editCompanyName').val(details.nomComplet);
        $('#editPhoneNumber').val(details.phoneNumber);
        $('#editAddress').val(details.address || '');
        $('#modalEditClient').modal('show');
      })
      .fail(() => showToastModal({ message: 'Erreur chargement client', type: 'error' }))
      .always(() => $btn.prop('disabled', false));
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

  $('#clientsTable tbody').on('click', '.accompte', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const data = table.row($btn.closest('tr')).data();
    $('#accompteClientId').val(data.id);
    $('#accompteAmount, #accompteNote, #accompteMode, #accompteReference').val('');
    $('#accompteDate').val(new Date().toISOString().slice(0, 10));
    const currency = $('#deviseA').find(':selected').val()
    chargeCurrencySolde(data.id, currency, '#soldeDeviseA')
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
      .done(function(response, textStatus, jqXHR) {
        showToastModal({ message: 'Accompte enregistré !', type: 'success' });
        $('#modalAccompteClient').modal('hide');
        table.ajax.reload();
        loadStats();
        setTimeout(()=>{window.open(`/api/transaction/${response.id}/receipt`, '_blank');}, 2000)
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur enregistrement acompte';
        showToastModal({ message: msg, type: 'error' });
      })
      .always(() => $btn.prop('disabled', false));
  });

  $('#clientsTable tbody').on('click', '.withdraw', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const data = table.row($btn.closest('tr')).data();
    $('#withdrawClientId').val(data.id);
    $('#withdrawAmount, #withdrawNote, #withdrawMode, #withdrawReference').val('');
    $('#withdrawDate').val(new Date().toISOString().slice(0, 10));
    const currency = $('#deviseW').find(':selected').val()
    chargeCurrencySolde(data.id, currency, '#soldeDeviseW')
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
      .done(function(response, textStatus, jqXHR)  {
        showToastModal({ message: 'Retrait effectué !', type: 'success' });
        $('#modalWithdrawClient').modal('hide');
        table.ajax.reload();
        loadStats();
        setTimeout(()=>{window.open(`/api/transaction/${response.id}/receipt`, '_blank');}, 2000)
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
        showToastModal({ message: msg, type: 'error' });
        
      })
      .always(() => $btn.prop('disabled', false));
  });

    $('#clientsTable tbody').on('click', '.exchange', function(e) {
        e.preventDefault();
        const $btn = $(this);
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);

        const data = table.row($btn.closest('tr')).data();  
        console.log(data)
        $('#exchangeClientId').val(data.id);
        $('#fromCurrency, #toCurrency').val('');
        $('#fromAmount, #toAmount').val('');
        $('#exchangeRate').text(''); // Clear the exchange rate display

        $('#currencyModal').modal('show');
        $btn.prop('disabled', false);
    });

  $('#clientsTable tbody').on('click', '.transfert-interclient', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const data = table.row($btn.closest('tr')).data();
    openInterclientModal(data.id, data.nomComplet);
    $btn.prop('disabled', false);
  });

    
  function chargeCurrencySolde(idClient, currency, input){ 
       $.get(`/api/client/${idClient}/stats/${currency}`, function(data) { 
            $(input).text(`${data.balance} ${currency}`);
        }).fail(function() {
            showToastModal({ message: 'Erreur lors de la récupération du solde.', type: 'error' });
        });
  }
  


  let deleteId = null;
  $('#clientsTable tbody').on('click', '.deactivate', function(e) {
    e.preventDefault();
    deleteId = $(this).data('id');
    $('#modalConfirmDelete').modal('show');
  });

  $('#modalConfirmDelete').on('click', '#confirmDeleteBtn', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    $.post(`/api/client/${deleteId}/deactivate`)
      .done(() => {
        showToastModal({ message: 'Client désactivé', type: 'warning' });
        $('#modalConfirmDelete').modal('hide');
        table.ajax.reload();
        loadStats();
      })
      .fail(() => showToastModal({ message: 'Erreur désactivation', type: 'error' }))
      .always(() => $btn.prop('disabled', false));
  });
  
  loadStats();

  bindInterclientModalEvents({
    onSuccess: function (response) {
      table.ajax.reload();
      loadStats();
      setTimeout(function () {
        window.open('/api/transaction/' + response.id + '/receipt', '_blank');
      }, 2000);
    }
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
        $devise.text(selectedDevise); 
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
    $destination.on('change', function() {
        updateUIByAgency();
        calculateTotal();
    });

    // Événement lors du changement de type d'opération
    $typeOps.on('change', function() {
        updateDeviseDisplay();
        calculateTotal();
    });

    // Événement lors du changement de devise
    $deviseExchange.on('change', function() {
        updateDeviseDisplay();
        calculateTotal();
    });

    // Événements pour le calcul en temps réel
    $montant.on('input', calculateTotal);
    $taux.on('input', calculateTotal);

    // Événement pour le bouton d'échange
    $exchangeButton.on('click', function() {
        // Validation des champs
        if (!$montant.val() || !$taux.val()) {
            showToastModal({message: 'Veuillez remplir tous les champs obligatoires.' , type : "warning"});
            return;
        } 
        
        // Récupération des données du formulaire
        const formData = {
            clientId: $('#exchangeClientId').val(),
            destination: $destination.find(":selected").val(),
            type: $typeOps.val(),
            deviseExchange: $deviseExchange.val(),
            montant: $montant.val(),
            date: $("#dateOps").val(),
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
});
