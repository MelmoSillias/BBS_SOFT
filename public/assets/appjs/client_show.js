// assets/clients/js/client_show.js

$(document).ready(function(){
  const clientId = extractClientId();

  // 1. Charger infos de base & stats
  loadClientInfo(clientId); 
  // 4. Transactions
  initTransactions(clientId);
});


/** Extrait l'ID client depuis l'URL : /client/{id}/... */
function extractClientId() {
    const parts = window.location.pathname.split('/');
    const idx = parts.indexOf('client');
    return (idx >= 0 && parts.length > idx+1) ? parts[idx+1] : null;
}


/** Charge et affiche les infos de base + statistiques du client */
function loadClientInfo(clientId) {
  $.ajax({
    url: `/api/client/${clientId}/stats`,
    method: 'GET'
  })
  .done(function(data) {
    $('#clientInfoStats').html(`
      <div class="col-lg-3 col-md-6">
        <div class="info-box mb-3">
          <span class="info-box-icon bg-info"><i class="bi bi-cash-stack"></i></span>
          <div class="info-box-content">
            <span class="info-box-text">Solde</span>
            <span class="info-box-number" id="balance">${parseFloat(data.balance).toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="info-box mb-3">
          <span class="info-box-icon bg-primary"><i class="bi bi-receipt"></i></span>
          <div class="info-box-content">
            <span class="info-box-text">Factures totales</span>
            <span class="info-box-number">${data.totalInvoices}</span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="info-box mb-3">
          <span class="info-box-icon bg-warning"><i class="bi bi-exclamation-octagon"></i></span>
          <div class="info-box-content">
            <span class="info-box-text">Impayées</span>
            <span class="info-box-number">${data.unpaidInvoices}</span>
          </div>
        </div>
      </div>
      <div class="col-lg-3 col-md-6">
        <div class="info-box mb-3">
          <span class="info-box-icon bg-success"><i class="bi bi-arrow-repeat"></i></span>
          <div class="info-box-content">
            <span class="info-box-text">Renouvelables</span>
            <span class="info-box-number">${data.activeRenewables}</span>
          </div>
        </div>
      </div>
    `);
  })
  .fail(function(){
    showToastModal({ message: "Impossible de charger les statistiques.", type: 'error' });
  });
}


/** Initialise le workflow des factures renouvelables */
function initRenewables(clientId) {
  let renewableLineIndex = 1;

  loadRenewables(clientId);

  $('#btnAddRenewable').on('click', function(){
    $('#modalAddRenewable').modal('show');
  });

  $('#btnAddRenewableLine').on('click', function(){
    const $template = $('.renewable-line').first().clone();
    $template.find('input').each(function(){
      const name = $(this).attr('name').replace(/\d+/, renewableLineIndex);
      $(this).attr('name', name).val('');
    });
    $('#renewableLines').append($template);
    renewableLineIndex++;
  });

  $('#renewableLines').on('click', '.btn-remove-line', function(){
    if($('#renewableLines .renewable-line').length > 1) {
      $(this).closest('.renewable-line').remove();
    }
  });

  $('#form-add-renewable').on('submit', function(e){
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const payload = {
      period:    $form.find('[name="period"]').val(),
      startDate: $form.find('[name="startDate"]').val(),
      amount:    0,
      nextDate:  $form.find('[name="startDate"]').val(),
      status:    "actif",
      items:     []
    };
    $('#renewableLines .renewable-line').each(function(){
      const desc = $(this).find('[name$="[description]"]').val();
      const amt  = parseFloat($(this).find('[name$="[amount]"]').val());
      const qty  = parseInt($(this).find('[name$="[quantity]"]').val(), 10);
      payload.items.push({ description: desc, amount: amt, quantity: qty });
      payload.amount += amt;
    });

    $.ajax({
      url: `/api/client/${clientId}/addren`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(function(){
      showToastModal({ message: "Facture renouvelable ajoutée.", type: 'success' });
      $('#modalAddRenewable').modal('hide');
      loadRenewables(clientId);
      loadClientInfo(clientId);
    })
    .fail(function(){
      showToastModal({ message: "Erreur création facture renouvelable.", type: 'error' });
    })
    .always(function(){
      $btn.prop('disabled', false);
    });
  });

  $('#renewableCards').on('click', '.btn-delete-renewable', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    if (!confirm("Confirmer la suppression ?")) return;
    $btn.prop('disabled', true);

    const rfId = $btn.data('id');
    $.ajax({
      url: `/api/renewable-facture/${rfId}`,
      method: 'DELETE'
    })
    .done(function(){
      showToastModal({ message: "Renouvelable supprimée.", type: 'success' });
      loadRenewables(clientId);
      loadClientInfo(clientId);
    })
    .fail(function(){
      showToastModal({ message: "Erreur suppression renouvelable.", type: 'error' });
    })
    .always(function(){
      $btn.prop('disabled', false);
    });
  });

  $('#renewableCards').on('click', '.btn-details-renewable', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const rfId = $btn.data('id');
    $.ajax({
      url: `/api/renewable-facture/${rfId}`,
      method: 'GET'
    })
    .done(function(rf) {
      $('#renewableDetailsPeriod')   .val(rf.period);
      $('#renewableDetailsStartDate') .val(rf.startAt);
      $('#renewableDetailsStatus')    .val(rf.state);
      $('#renewableDetailsItems').empty();
      rf.items.forEach(item => {
        $('#renewableDetailsItems').append(`
          <tr>
            <td>${item.description}</td>
            <td>${item.amount}</td>
            <td>${item.quantity}</td>
            <td>${item.amount * item.quantity}</td>
          </tr>
        `);
      });
      $('#renewableDetailsTotal').text(rf.amount);
      $('#modalRenewableDetails').modal('show');
    })
    .fail(function(){
      showToastModal({ message: "Impossible de charger les détails.", type: 'error' });
    })
    .always(function(){
      $btn.prop('disabled', false);
    });
  });
}


/** Charge les factures renouvelables */
function loadRenewables(clientId) {
  $.ajax({
    url: `/api/client/${clientId}/renewable-factures`,
    method: 'GET'
  })
  .done(function(list) {
    const $container = $('#renewableCards').empty();
    if (!list || list.length === 0) {
      $container.append('<div class="alert alert-info mb-3">Aucune facture renouvelable.</div>');
      return;
    }
    list.forEach(rf => {
      $container.append(`
        <div class="card mb-3 shadow-sm h-100" data-id="${rf.id}">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h5 class="card-title text-primary mb-2">${rf.period.toUpperCase()}</h5>
                <dl class="row mb-0">
                  <dt class="col-6">Montant</dt>
                  <dd class="col-6 text-success mb-2">${parseFloat(rf.amount).toLocaleString()} FCFA</dd>
                  <dt class="col-6">Prochaine échéance</dt>
                  <dd class="col-6 text-danger mb-0">${rf.nextDate}</dd>
                </dl>
              </div>
              <div class="btn-group-vertical">
                <button class="btn btn-sm btn-outline-info btn-details-renewable" data-id="${rf.id}" title="Voir">
                  <i class="bi bi-info-circle"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-renewable" data-id="${rf.id}" title="Supprimer">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    });
  })
  .fail(function(){
    showToastModal({ message: "Erreur chargement renouvelables.", type: 'error' });
  });
}


/** Initialise la section Factures ponctuelles */
function initInvoices(clientId) {
  $('#filterInvoiceDate').daterangepicker({ locale:{ format:'YYYY-MM-DD' } })
    .on('apply.daterangepicker', () => invoiceTable.ajax.reload());

  $('#filterInvoiceStatus').on('change', () => invoiceTable.ajax.reload());

  const invoiceTable = $('#invoicesTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Factures client',
        exportOptions: { columns: [0,1,2,3, 4] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Factures client',
        exportOptions: { columns: [0,1,2,3,4] },
        customize: function(doc) {
          doc.content[1].table.widths = ['*','*','*','*'];
          doc.content[1].table.body[0].forEach(cell => {
            cell.fillColor = '#007bff';
            cell.color     = '#ffffff';
          });
        }
      }
    ],
    ajax: {
      url: `/api/client/${clientId}/invoices`,
      data: d => {
        const range = $('#filterInvoiceDate').val().split(' - ');
        d.from   = range[0];
        d.to     = range[1];
        d.status = $('#filterInvoiceStatus').val();
      }
    },
    columns: [
      { data: 'reference' },
      { data: 'amount',   render: d => parseFloat(d).toLocaleString() },
      { data: 'remain',   render: d => parseFloat(d).toLocaleString() },
      { data: 'status' },
      { data: 'createdAt' },
      {
        data: null, orderable: false,
        render: row => `
          <button class="btn btn-sm btn-info btn-view-details-invoice" data-id="${row.id}">
            <i class="bi bi-chevron-down"></i>
          </button>
          <button class="btn btn-sm btn-success btn-pay-invoice" data-id="${row.id}" data-amount="${row.remain}">
            <i class="bi bi-wallet2"></i>
          </button>
          <button class="btn btn-sm btn-secondary btn-print-invoice" data-id="${row.id}">
            <i class="bi bi-printer"></i>
          </button>`
      }
    ],
    order: [[4,'desc']],
    language: { url:'/api/datatable_json_fr' }
  });

  $('#invoicesTable tbody').on('click', '.btn-print-invoice', function(){
    const id = $(this).data('id');
    $('#cachetModal').data('id', id)
    $('#cachetModal').modal("show")
  });

  $('#cachetYes').on('click', () => {
    const id = $('#cachetModal').data('id');
    $('#cachetModal').modal("hide")
    window.open(`/api/invoice/${id}/print?cachet=oui`, '_blank');
  });

   $('#cachetNo').on('click', () => {
     const id = $('#cachetModal').data('id');
    $('#cachetModal').modal("hide")
    window.open(`/api/invoice/${id}/print?cachet=non`, '_blank');
  });

  let remainingAmount = 0;

  $('#invoicesTable tbody').on('click', '.btn-pay-invoice', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const invoiceId = $btn.data('id');
    remainingAmount   = parseFloat($btn.data('amount'));

    $('#soldeCompteLocal').text($('#balance').text());
    $('#remainingAmount')  .text(remainingAmount);
    $('#paymentAmount')
      .attr('max', remainingAmount)
      .val(remainingAmount);

    $('#modalInvoicePayment')
      .data('id', invoiceId)
      .data('remain', remainingAmount)
      .modal('show');

    $btn.prop('disabled', false);
  });

  $(document).on('input', '#paymentAmount', function(){
    const max = parseFloat(this.max) || 0;
    let val = parseFloat(this.value) || 0;
    if (val > max) val = max;
    this.value = val;
    $('#remainingAmount').text((remainingAmount - val).toLocaleString());
  });

  $('#form-invoice-payment').on('submit', function(e){
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const invoiceId = $form.closest('#modalInvoicePayment').data('id');
    const payload   = {
      amount:        parseFloat($('#paymentAmount').val()),
      paymentMethod: $form.find('select[name="paymentMethod"]').val(),
      reference:     $form.find('input[name="reference"]').val()
    };

    $.ajax({
      url: `/api/invoice/${invoiceId}/pay`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(function(){
      showToastModal({ message: "Paiement enregistré.", type: 'success' });
      invoiceTable.ajax.reload();
      $('#transactionsTable').DataTable().ajax.reload();
      loadClientInfo(clientId);
      $('#modalInvoicePayment').modal('hide');
    })
    .fail(function(){
      showToastModal({ message: "Erreur lors du paiement.", type: 'error' });
    })
    .always(function(){
      $btn.prop('disabled', false);
    });
  });

  $('#invoicesTable tbody').on('click', '.btn-view-details-invoice', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const tr  = $btn.closest('tr');
    const row = invoiceTable.row(tr);

    if (row.child.isShown()) {
      row.child.hide();
      tr.removeClass('shown');
      $btn.prop('disabled', false);
    } else {
      const invId = $btn.data('id');
      $.ajax({
        url: `/api/invoice/${invId}/items`,
        method: 'GET'
      })
      .done(function(items){
        let html = `
          <div class="table-responsive">
            <table class="table table-bordered table-sm mb-0">
              <thead class="table-light">
                <tr><th>Description</th><th>Montant</th><th>Qté</th></tr>
              </thead><tbody>`;
        items.forEach(i => {
          html += `
            <tr>
              <td>${i.description}</td>
              <td class="text-end">${parseFloat(i.amount).toLocaleString()} FCFA</td>
              <td class="text-center">${i.quantity}</td>
            </tr>`;
        });
        html += `</tbody></table></div>`;
        row.child(html).show();
        tr.addClass('shown');
      })
      .fail(function(){
        showToastModal({ message: "Impossible de charger les lignes.", type: 'error' });
      })
      .always(function(){
        $btn.prop('disabled', false);
      });
    }
  });

  $('#btnAddInvoice').on('click', () => $('#modalAddInvoice').modal('show'));

  let invoiceLineIndex = 1;
  $('#btnAddInvoiceLine').on('click', function(){
    const $tpl = $('.invoice-line').first().clone();
    $tpl.find('input, textarea').each(function(){
      const newName = $(this).attr('name').replace(/\d+/, invoiceLineIndex);
      $(this).attr('name', newName).val('');
    });
    $('#invoiceLines').append($tpl);
    invoiceLineIndex++;
  });

  $('#invoiceLines').on('click', '.btn-remove-line', function(){
    if($('#invoiceLines .invoice-line').length > 1) {
      $(this).closest('.invoice-line').remove();
    }
  });

  $('#form-add-invoice').on('submit', function(e){
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const payload = {
      createdAt: $form.find('[name="createdAt"]').val(),
      status:    "impayée",
      amount:    0,
      month_str: $form.find('[name="month_str"]').val(),
      items:     []
    };
    $form.find('.invoice-line').each(function(){
      const desc = $(this).find('[name$="[description]"]').val();
      const amt  = parseFloat($(this).find('[name$="[amount]"]').val());
      const qty  = parseInt($(this).find('[name$="[quantity]"]').val(),10);
      payload.items.push({ description: desc, amount: amt, quantity: qty });
      payload.amount += amt;
    });

    $.ajax({
      url: `/api/client/${clientId}/invoice`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(function(){
      showToastModal({ message: "Facture créée.", type: 'success' });
      $('#modalAddInvoice').modal('hide');
      invoiceTable.ajax.reload();
      loadClientInfo(clientId);
    })
    .fail(function(){
      showToastModal({ message: "Erreur création facture.", type: 'error' });
    })
    .always(function(){
      $btn.prop('disabled', false);
    });
  });
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
        exportOptions: { columns: [0,1,2,3] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Transactions client',
        exportOptions: { columns: [0,1,2,3] }
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
        render: function(data) {
          if (data === 'entrée') return `<span class="badge bg-success">${data}</span>`;
          if (data === 'sortie') return `<span class="badge bg-danger">${data}</span>`;
          return `<span class="badge bg-secondary">${data}</span>`;
        }
      },
      { data: 'amount', render: d => parseFloat(d).toLocaleString() },
      { data: 'paymentMethod' },
      { data: 'paymentReference' }
    ],
    order: [[0,'desc']],
    language: { url:'/api/datatable_json_fr' }
  });
}
