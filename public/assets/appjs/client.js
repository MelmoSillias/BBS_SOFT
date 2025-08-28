$(document).ready(function() {
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
      { data: 'nomComplet' },
      { data: 'phoneNumber' },
      { data: 'balanceCFA', render: d => parseFloat(d).toLocaleString() },
      { data: 'balanceUSD', render: d => parseFloat(d).toLocaleString() },
      { data: 'balanceEUR', render: d => parseFloat(d).toLocaleString() },
      { data: 'id', orderable: false, render: renderActions }
    ],
    language: { url: '/api/datatable_json_fr' },
    order: [[0, 'asc']],
  });

  function renderActions(id) {
    return `
      <button class="btn btn-sm btn-info modify" data-id="${id}" title="Modifier">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button class="btn btn-sm btn-danger deactivate" data-id="${id}" title="Désactiver">
        <i class="bi bi-x-circle"></i>
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
      .done(() => {
        showToastModal({ message: 'Accompte enregistré !', type: 'success' });
        $('#modalAccompteClient').modal('hide');
        table.ajax.reload();
        loadStats();
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
      .done(() => {
        showToastModal({ message: 'Retrait effectué !', type: 'success' });
        $('#modalWithdrawClient').modal('hide');
        table.ajax.reload();
        loadStats();
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
            alert("Veuillez remplir tous les champs.");
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
              table.ajax.reload();
              loadStats();
          })
          .fail(() => {
            showToastModal({ message: "Erreur lors de l'échange de devise.", type: 'error' }); 
          }); 
    });

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
 

  function chargeCurrencySolde(idClient, currency, input){ 
       $.get(`/api/client/${idClient}/stats/${currency}`, function(data) { 
            $(input).text(`${data.balance} ${currency}`);
        }).fail(function() {
            showToastModal({ message: 'Erreur lors de la récupération du solde.', type: 'error' });
        });
  }
  
  loadStats();
});
