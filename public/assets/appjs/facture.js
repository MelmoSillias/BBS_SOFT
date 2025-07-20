// public/assets/appjs/factures.js

$(document).ready(function(){
  let invoiceTable;
  let clientBalance = 0;

  initStats();
  initFiltersAndTable();
  initExportButtons();
  initRowActions();
  initAddInvoiceForm();
});


/** 1. Statistiques globales **/
function initStats() {
  reloadStats();
}

function reloadStats() {
  const dr = $('#filterDate').val() ? $('#filterDate').val().split(' - ') : [null, null];
  const params = {};
  if (dr[0]) params.from = dr[0];
  if (dr[1]) params.to   = dr[1];

  $.get('/api/invoices/stats', params)
    .done(data => {
      $('#invoiceStats').html(`
        <div class="row gx-2 gy-3">
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <div class="info-box">
              <span class="info-box-icon bg-primary"><i class="bi bi-receipt"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Total</span>
                <span class="info-box-number">${data.total}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <div class="info-box">
              <span class="info-box-icon bg-info"><i class="bi bi-people-fill"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Intern</span>
                <span class="info-box-number">${data.intern}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <div class="info-box">
              <span class="info-box-icon bg-success"><i class="bi bi-building"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Gesta</span>
                <span class="info-box-number">${data.gesta}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <div class="info-box">
              <span class="info-box-icon bg-warning"><i class="bi bi-exclamation-octagon"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Impayées</span>
                <span class="info-box-number">${data.unpaid}</span>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-2">
            <div class="info-box">
              <span class="info-box-icon bg-secondary"><i class="bi bi-clock-history"></i></span>
              <div class="info-box-content">
                <span class="info-box-text">Nouvelles</span>
                <span class="info-box-number">${data.recent}</span>
              </div>
            </div>
          </div>
        </div>
      `);
    })
    .fail(() => 
      showToastModal({ message: "Impossible de charger les stats", type: 'error' })
    );
}


/** 2. DataTable & filtres **/
function initFiltersAndTable() {
  // Charger liste clients pour filtres
  $.get('/api/clients').done(res => {
    let opts = '<option value="">-- choisir un client --</option>';
    res.data.forEach(c => {
      opts += `<option value="${c.id}">${c.companyName}${c.type==='gesta'?' - Gesta':''}</option>`;
    });
    $('#filterClient, #addInvoiceClient').html(opts);
  });

  // Date range picker
  $('#filterDate').daterangepicker({
    locale: {
      format: 'YYYY-MM-DD',
      separator: ' - ',
      applyLabel: 'Appliquer',
      cancelLabel: 'Annuler',
      fromLabel: 'De',
      toLabel: 'À',
      customRangeLabel: 'Personnalisé',
      daysOfWeek: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
      monthNames: ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
      firstDay:1
    },
    startDate: moment().startOf('month'),
    endDate:   moment().endOf('month')
  })
  .on('apply.daterangepicker', function() {
    invoiceTable.ajax.reload();
    reloadStats();
  })
  .on('cancel.daterangepicker', function(){
    $(this).val('');
    invoiceTable.ajax.reload();
    reloadStats();
  });

  // Autres filtres
  $('#filterClientType,#filterClient,#filterStatus')
    .on('change', () => invoiceTable.ajax.reload());

  let refTimer;
  $('#filterReference').on('keyup', function(){
    clearTimeout(refTimer);
    refTimer = setTimeout(() => invoiceTable.ajax.reload(), 500);
  });

  // Initialisation DataTable
  invoiceTable = $('#invoicesTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        className: 'buttons-excel d-none', // Caché, déclenché par votre bouton externe
        title: 'Liste des Factures',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      },
      {
        extend: 'pdfHtml5',
        className: 'buttons-pdf d-none', // Caché, déclenché par votre bouton externe
        title: 'Liste des Factures',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      }
    ],
    ajax: {
      url: '/api/invoices',
      data: d => {
        const dr = $('#filterDate').val().split(' - ');
        d.from       = dr[0] || null;
        d.to         = dr[1] || null;
        d.clientType = $('#filterClientType').val();
        d.clientId   = $('#filterClient').val();
        d.reference  = $('#filterReference').val();
        d.status     = $('#filterStatus').val();
      }
    },
    columns: [
      { data: 'reference',   width:'10%' },
      { data: 'companyName', width:'28%' },
      { data: 'amount',      width:'14%', render: d => parseFloat(d).toLocaleString() },
      { data: 'remain',      width:'10%', render: d => parseFloat(d).toLocaleString() },
      { data: 'status',      width:'10%', render: renderStatusBadge },
      { data: 'createdAt',   width:'10%' },
      { data: 'id',          width:'20%', orderable:false, render: renderActionButtons }
    ],
    order: [[6,'desc']],
    pageLength: 20,
    lengthMenu: [[20,50,100],[20,50,100]],
    language: { url:'/api/datatable_json_fr' }
  });

  // Impression individuelle
  $('#invoicesTable tbody').on('click', '.btn-print', function(){
    const id = $(this).data('id');
    $('#cachetModal').data('id', id)
    $('#cachetModal').modal("show")
  });

  $('#invoicesTable').addClass('border--top border-bottom my-4');
}

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

function renderStatusBadge(status) {
  const cls = status === 'payé' 
    ? 'success' 
    : status.includes('partiel') 
      ? 'warning' 
      : 'danger';
  return `<span class="badge bg-${cls}">${status}</span>`;
}

function renderActionButtons(id, type, row) {
  // Affichage conditionnel des boutons selon le statut
  let buttons = '';

  // Toujours afficher "Imprimer" et "Client"
  buttons += `
    <button class="btn btn-sm btn-secondary btn-print" 
            data-id="${id}" 
            title="Imprimer">
      <i class="bi bi-printer"></i>
    </button>
    <button class="btn btn-sm btn-details btn-info" 
            data-id="${id}" title="Détails">
      <i class="bi bi-info-circle"></i> 
    </button>
  `;

  // Préparer les autres boutons pour le dropdown
  let dropdown = '';

  // Statut
  const status = (row.status || '').toLowerCase();

  // Afficher "Payer" si impayé ou partiellement payé
  if (status === 'impayée' || status.includes('partiel')) {
    dropdown += `
      <button class="dropdown-item btn-pay-invoice" 
              data-id="${id}" 
              data-amount="${row.remain}" 
              data-local-account="${row.clientSolde}">
        <i class="bi bi-cash-stack"></i> Payer
      </button>
    `;
  }

  // Afficher "Annuler" seulement si impayé
  if (status === 'impayée') {
    dropdown += `
      <button class="dropdown-item btn-cancel text-danger" 
              data-id="${id}">
        <i class="bi bi-x-circle"></i> Annuler
      </button>
    `;
  }

  // Toujours afficher "Détails" et "Historique"
  dropdown += `
    <button class="dropdown-item btn-client" 
            data-id="${row.clientId}" >
      <i class="bi bi-escape"></i> Ouvrir la fiche client
    </button>
    <button class="dropdown-item btn-history" 
            data-id="${id}">
      <i class="bi bi-clock-history"></i> Historique de paiement
    </button>
  `;

  // Si au moins un bouton dans le dropdown, afficher le menu
  if (dropdown) {
    buttons += `
      <div class="btn-group">
        <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots"></i>
        </button>
        <div class="dropdown-menu">
          ${dropdown}
        </div>
      </div>
    `;
  }

  return buttons;
}


/** 3. Export **/
function initExportButtons() {
  $('#btnExportExcel').on('click', () => invoiceTable.button('.buttons-excel').trigger());
  $('#btnExportPDF').  on('click', () => invoiceTable.button('.buttons-pdf').trigger());
}


/** 4. Actions ligne **/
function initRowActions() {
  // Toggle détails
  $('#invoicesTable tbody').on('click', '.btn-details', function(){
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
      const id = $btn.data('id');
      $.get(`/api/invoice/${id}/items`)
        .done(items => {
          let html = `
            <table class="table">
              <thead>
                <tr><th>Desc</th><th>Montant</th><th>Qté</th></tr>
              </thead>
              <tbody>`;
          items.forEach(i => {
            html += `
              <tr>
                <td>${i.description}</td>
                
                <td>${parseFloat(i.amount).toLocaleString()}</td>
                <td>${i.quantity}</td>
              </tr>`;
          });
          html += '</tbody></table>';
          row.child(html).show();
          tr.addClass('shown');
        })
        .fail(() => showToastModal({ message:'Impossible de charger les lignes', type:'error' }))
        .always(() => $btn.prop('disabled', false));
    }
  });

  // Annulation
  $('#invoicesTable tbody').on('click', '.btn-cancel', function(){
    const id = $(this).data('id');
    $('#cancelInvoiceId').val(id);
    $('#form-cancel-invoice textarea').val('');
    $('#modalCancelInvoice').modal('show');
  });
  $('#form-cancel-invoice').on('submit', function(e){
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id     = $('#cancelInvoiceId').val();
    const reason = $form.find('[name="reason"]').val();
    $.ajax({
      url: `/api/invoice/${id}/cancel`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ reason })
    })
    .done(() => {
      showToastModal({ message:'Facture annulée', type:'error' });
      $('#modalCancelInvoice').modal('hide');
      reloadStats();
      invoiceTable.ajax.reload();
    })
    .fail(() => showToastModal({ message:'Erreur annulation', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });

  // Aller vers client
  $('#invoicesTable tbody').on('click', '.btn-client', function(){
    const id = $(this).data('id');
    window.location.href = `/dashboard/client/${id}/details`;
  });

  // Historique
  $('#invoicesTable tbody').on('click', '.btn-history', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    $('#historyTable tbody').empty();
    $.get(`/api/invoice/${id}/transactions`)
      .done(list => {
        list.forEach(tx => {
          $('#historyTable tbody').append(`
            <tr>
              <td>${tx.date}</td>
              <td>${parseFloat(tx.amount).toLocaleString()}</td>
              <td>${tx.paymentMethod}</td>
              <td>${tx.paymentReference}</td>
            </tr>`);
        });
        $('#modalHistoryInvoice').modal('show');
      })
      .fail(() => showToastModal({ message:'Impossible de charger l’historique', type:'error' }))
      .always(() => $btn.prop('disabled', false));
  });

  // Paiement
  $(document).on('click', '.btn-pay-invoice', function(){
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const invoiceId = $btn.data('id');
    clientBalance    = parseFloat($btn.data('local-account'));
    const remain     = parseFloat($btn.data('amount'));

    $('#soldeCompteLocal').text(clientBalance.toLocaleString() + ' F CFA');
    $('#remainingAmount').text(remain);
    $('#paymentAmount')
      .attr('max', remain)
      .val(remain);

    $('#modalInvoicePayment')
      .data('remain', remain)
      .data('id', invoiceId)
      .modal('show');

    $btn.prop('disabled', false);
  });

  // Contrôle montant
  $(document).on('input', '#paymentAmount', function(){
    const max = parseFloat(this.max) || 0;
    let val   = parseFloat(this.value) || 0;
    if (val > max) val = max;
    this.value = val;
    $('#remainingAmount').text((parseFloat($('#modalInvoicePayment').data('remain')) - val).toLocaleString());
  });

  // Soumission paiement
  $('#form-invoice-payment').on('submit', function(e){
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const invoiceId    = $form.closest('#modalInvoicePayment').data('id');
    const amount       = parseFloat($form.find('#paymentAmount').val());
    const paymentMethod= $form.find('select[name="paymentMethod"]').val();
    const reference    = $form.find('input[name="reference"]').val();

    const payload = { amount, paymentMethod, reference };

    $.ajax({
      url: `/api/invoice/${invoiceId}/pay`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(() => {
      showToastModal({ message:'Paiement enregistré.', type:'success' });
      invoiceTable.ajax.reload();
      $('#modalInvoicePayment').modal('hide');
      reloadStats();
    })
    .fail(() => showToastModal({ message:'Erreur lors du paiement.', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });
}


/** 5. Formulaire d'ajout en bas de page **/
function initAddInvoiceForm() {
  let idx = 1;

  $('#btnAddInvoiceLine').on('click', function(){
    const $tpl = $('.invoice-line').first().clone();
    $tpl.find('input,textarea').each(function(){
      const name = $(this).attr('name').replace(/\d+/, idx);
      $(this).attr('name', name).val($(this).is('[type="number"]') ? 0 : '');
    });
    $('#invoiceLines').append($tpl);
    idx++;
  });

  $('#invoiceLines').on('click', '.btn-remove-line', function(){
    if ($('#invoiceLines .invoice-line').length > 1) {
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
      clientId:  $form.find('[name="clientId"]').val(),
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
      url: `/api/client/${payload.clientId}/invoice`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(() => {
      showToastModal({ message:'Facture créée', type:'success' });
      $form[0].reset();
      $('#invoiceLines').html($('.invoice-line').first().prop('outerHTML'));
      invoiceTable.ajax.reload();
      reloadStats();
    })
    .fail(() => showToastModal({ message:'Erreur création facture', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });
}
