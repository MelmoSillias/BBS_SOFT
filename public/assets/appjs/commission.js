// public/assets/appjs/commissions.js

$(document).ready(function(){
  let commissionTable;
  initFilters();
  initTable();
  initExportButtons();
  initRowActions();
  initTakeCommissionForm();
  initInvoiceInfoModal();
});


/** Debounce helper **/
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


/** 1. Filtres **/
function initFilters() {
  // Date range picker
  $('#filterPeriod').daterangepicker({
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
      firstDay: 1
    },
    startDate: moment().startOf('month'),
    endDate:   moment().endOf('month'),
    autoUpdateInput: false
  })
  .on('apply.daterangepicker', function(ev, picker){
    $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    commissionTable.ajax.reload();
  })
  .on('cancel.daterangepicker', function(){
    $(this).val('');
    commissionTable.ajax.reload();
  });

  // Text filters with debounce
  $('#filterClientName').on('keyup', debounce(() => commissionTable.ajax.reload(), 500));
  $('#filterCommittee'). on('keyup', debounce(() => commissionTable.ajax.reload(), 500));

  // Clear all filters
  $('#btnClearFilters').on('click', function(){
    $('#filterClientName,#filterCommittee').val('');
    $('#filterPeriod').val('');
    commissionTable.ajax.reload();
  });
}


/** 2. Initialisation de la DataTable **/
function initTable() {
  commissionTable = $('#commissionsTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      { extend: 'excelHtml5', className: 'buttons-excel d-none', title: 'Liste des commissions', exportOptions: { columns: [1,2,3,4,5] } },
      { extend: 'pdfHtml5',   className: 'buttons-pdf d-none',   title: 'Liste des commissions' , exportOptions: { columns: [1,2,3,4,5] } },
      { extend: 'print',      className: 'buttons-print d-none' }
    ],
    ajax: {
      url: '/api/commissions',
      data: d => {
        const period = $('#filterPeriod').val().split(' - ');
        if (period.length === 2) {
          d.from = period[0];
          d.to   = period[1];
        }
        d.clientName = $('#filterClientName').val();
        d.committee  = $('#filterCommittee').val();
      }
    },
    columns: [
      { data: 'id' },
      { data: 'clientName' },
      { data: 'committeeName' },
      { data: 'amount', render: d => parseFloat(d).toLocaleString() },
      { data: 'penality', render: d => parseFloat(d||0).toLocaleString() },
      { data: 'status', render: renderStatusBadge },
      { data: 'id', orderable: false, render: renderActionButtons }
    ],
    pageLength: 20,
    lengthMenu: [[20,50,100],[20,50,100]],
    language: { url: '/api/datatable_json_fr' }
  });
}

function renderStatusBadge(data, type, row) {
  if (type !== 'display') return data;
  if (data === 'payé') {
    const date = new Date(row.taken_at);
    const formattedDate = date.toLocaleDateString('fr-FR');
    return `<span class="badge bg-success">Payé</span> <span class="text-normal">${formattedDate}</span>`;
  } else if (data === 'en attente') {
    return `<span class="badge bg-warning">En attente</span>`;
  }
  return data;
}

function renderActionButtons(id, type, row) {
  if (row.status !== 'payé') {
    return `
      <button class="btn btn-sm btn-success btn-take"    data-id="${id}" data-amount="${row.amount}" title="Prendre">
        <i class="bi bi-cash-stack"></i>
      </button>
      <button class="btn btn-sm btn-info btn-info-inv"   data-id="${id}" title="Infos Facture">
        <i class="bi bi-info-circle"></i>
      </button>
    `;
  } else {
    return `
      <button class="btn btn-sm btn-info btn-info-inv"  data-id="${id}" title="Infos Facture">
        <i class="bi bi-info-circle"></i>
      </button>
      <button class="btn btn-sm btn-primary btn-print" data-id="${id}" title="Imprimer reçu">
        <i class="bi bi-printer"></i>
      </button>
    `;
  }
}


/** 3. Export Excel/PDF/Print Liste **/
function initExportButtons() {
  $('#btnExportExcel').on('click', () => commissionTable.button('.buttons-excel').trigger());
  $('#btnExportPDF').  on('click', () => commissionTable.button('.buttons-pdf').trigger());
  $('#btnPrintList'). on('click', () => commissionTable.button('.buttons-print').trigger());
}


/** 4. Actions sur les lignes **/
function initRowActions() {
  // Ouvrir le modal « Prendre commission »
  $('#commissionsTable tbody').on('click', '.btn-take', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id     = $btn.data('id');
    const amount = parseFloat($btn.data('amount'));

    $('#commissionId').val(id);
    $('#form-take-commission')[0].reset();
    $('#commissionAmount').val(amount);
    $('#form-take-commission').find('[name="penality"]').attr('max', amount);

    $('#modalTakeCommission').modal('show');
    $btn.prop('disabled', false);
  });

  // Charger et afficher les infos facture
  $('#commissionsTable tbody').on('click', '.btn-info-inv', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    $.ajax({
      url: `/api/commission/${id}/invoice`,
      method: 'GET'
    })
    .done(function(data) {
      $('#modalInvoiceInfo').data('commission-id', id);
      $('#info-reference').text(data.reference);
      $('#info-date').     text(data.date);
      $('#info-amount').   text(parseFloat(data.amount).toLocaleString());
      $('#info-remain').   text(parseFloat(data.remain).toLocaleString());
      $('#info-status').   text(data.status);

      const $tbody = $('#info-items').empty();
      data.items.forEach(it => {
        $tbody.append(`
          <tr>
            <td>${it.description}</td>
            <td>${parseFloat(it.amount).toLocaleString()}</td>
            <td>${it.quantity}</td>
          </tr>
        `);
      });

      $('#modalInvoiceInfo').modal('show');
    })
    .fail(function() {
      showToastModal({ message:'Impossible de charger les infos facture', type:'error' });
    })
    .always(function() {
      $btn.prop('disabled', false);
    });
  });

  // Imprimer reçu
  $('#commissionsTable tbody').on('click', '.btn-print', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    window.open(`/commission/${id}/receipt`, '_blank');
    setTimeout(() => $btn.prop('disabled', false), 1000);
  });
}


/** 5. Formulaire « Prendre la commission » **/
function initTakeCommissionForm() {
  $('#form-take-commission').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id      = $('#commissionId').val();
    const payload = {
      amount:   parseFloat($form.find('[name="amount"]').val()),
      penality: parseFloat($form.find('[name="penality"]').val() || 0)
    };

    $.ajax({
      url: `/api/commission/${id}/take`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(function() {
      showToastModal({ message:'Commission prise avec succès', type:'success' });
      $('#modalTakeCommission').modal('hide');
      commissionTable.ajax.reload();
    })
    .fail(function() {
      showToastModal({ message:'Erreur lors de la prise de commission', type:'error' });
    })
    .always(function() {
      $btn.prop('disabled', false);
    });
  });
}


/** 6. Modal « Infos Facture » **/
function initInvoiceInfoModal() {
  $('#btnPrintReceipt').on('click', function() {
    const id = $('#modalInvoiceInfo').data('commission-id');
    window.open(`/commission/${id}/receipt`, '_blank');
  });
}
