$(document).ready(function() {
  let supplierTable, expenseTable;

  initPendingCount();
  loadStats()
  initSupplierSection();
  initExpenseSection();
  initTransferModal();
  initReceiptModal();
});


/** 1. Compte des validations en attente **/
function initPendingCount() {
  $.get('/api/account-transactions-validations')
    .done(res => {
      const list = res.data || [];
      $('#pendingCount').text(list.length);
      const $container = $('#listValidation').empty();

      if (!list.length) {
        $container.append('<div class="alert alert-info mb-3">Aucune transaction à valider.</div>');
      } else {
        list.forEach(tx => {
          $container.append(`
            <div class="card mb-3 shadow-sm" data-id="${tx.id}">
              <div class="card-body p-3 d-flex justify-content-between">
                <dl class="row mb-0 flex-grow-1">
                  <dt class="col-6">Compte</dt>
                  <dd class="col-6 fw-bold text-info">${tx.account_type==='supplier'?'Approvisionnement':'Dépense'}</dd>
                  <dt class="col-6">Montant</dt>
                  <dd class="col-6 ${parseFloat(tx.amount)<0?'text-danger':'text-success'}">
                    ${parseFloat(tx.amount).toLocaleString()} FCFA
                  </dd>
                  <dt class="col-6">Motif</dt>
                  <dd class="col-6">${tx.reason}</dd>
                  <dt class="col-6">Description</dt>
                  <dd class="col-6">${tx.describ}</dd>
                  <dt class="col-6">Date</dt>
                  <dd class="col-6">${tx.createdAt}</dd>
                  <dt class="col-6">Utilisateur</dt>
                  <dd class="col-6">${tx.user}</dd>
                </dl>
                <button
                  class="btn btn-sm btn-success btn-validate-transaction"
                  data-id="${tx.id}"
                  title="Valider"
                ><i class="bi bi-check-circle"></i></button>
              </div>
            </div>
          `);
        });
      }
    })
    .fail(() => showToastModal({ message:'Impossible de charger les validations', type:'error' }))
    .always(() => {
      // délégation du click sur les boutons "Valider"
      $('#listValidation')
        .off('click', '.btn-validate-transaction')
        .on('click', '.btn-validate-transaction', function() {
          const $btn = $(this);
          if ($btn.prop('disabled')) return;
          $btn.prop('disabled', true);
          const txId = $btn.data('id');
          $('#modalConfirmValidation').data('transaction-id', txId).modal('show');
          $btn.prop('disabled', false);
        });

      // handler unique pour le bouton de confirmation
      $('#btnConfirmValidation')
        .off('click')
        .on('click', function() {
          const $btn = $(this);
          if ($btn.prop('disabled')) return;
          $btn.prop('disabled', true);
          const txId = $('#modalConfirmValidation').data('transaction-id');
          if (!txId) { $btn.prop('disabled', false); return; }

          $.post(`/api/account-transactions/${txId}/validate`)
            .done(() => {
              showToastModal({ message:'Transaction validée', type:'success' });
              $('#modalConfirmValidation').modal('hide');
              initPendingCount();
              if (supplierTable) supplierTable.ajax.reload();
              if (expenseTable) expenseTable.ajax.reload();
            })
            .fail(() => showToastModal({ message:'Erreur validation transaction', type:'error' }))
            .always(() => $btn.prop('disabled', false));
        });

      // rafraîchir toutes les 60s
      setTimeout(initPendingCount, 60000);
    });
}

function loadStats() {
    $.get('/api/finances/soldes', stats => {
      $('#SoldeAppr').text(parseFloat(stats.supplier).toLocaleString() + ' FCFA');
      $('#SoldeDep').text(parseFloat(stats.expense).toLocaleString() + ' FCFA');
    })
    .fail(() => showToastModal({ message:'Impossible de charger les soldes', type:'error' }));
  }
    

/** 2. Section Approvisionnement **/
function initSupplierSection() {
  // filtres
  $('#filterSupplierPeriod').daterangepicker({
    locale: { format:'YYYY-MM-DD',       applyLabel: 'Appliquer',
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
    autoUpdateInput: true
  })
  .on('apply.daterangepicker', (e,p) => {
    $('#filterSupplierPeriod').val(p.startDate.format('YYYY-MM-DD') + ' - ' + p.endDate.format('YYYY-MM-DD'));
    supplierTable.ajax.reload();
    loadStats()
  })
  .on('cancel.daterangepicker', () => {
    $('#filterSupplierPeriod').val('');
    supplierTable.ajax.reload();
    loadStats()
  });

  $('#filterSupplierStatus').on('change', () => supplierTable.ajax.reload());
  $('#btnClearSupplierFilters').on('click', () => {
    $('#filterSupplierPeriod,#filterSupplierStatus').val('');
    supplierTable.ajax.reload();
    loadStats()
  });

  // DataTable
  supplierTable = $('#supplierTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5', className:'buttons-excel d-none',
        exportOptions:{columns:[0,4,1,2,3]},
        title:'Caisse Approvisionnement', filename:'Approvisionnements',
        customizeData: d=> d.header=['Date','Débit','Crédit','Solde']
      },
      {
        extend:'pdfHtml5', className:'buttons-pdf d-none',
        exportOptions:{columns:[0,4,1,2,3]},
        title:'Caisse Approvisionnement', filename:'Approvisionnements',
        customize: doc=>{
          doc.content[1].table.headerRows=1;
          doc.content[1].table.body[0]=['Date', 'Motif','Débit','Crédit','Solde'];
        }
      },
      {
        extend:'print', className:'buttons-print d-none',
        exportOptions:{columns:[0,1,2,3]},
        title:'Caisse Approvisionnement',
        customize: win=>{
          $(win.document.body).find('table thead tr th')
            .each((i,th)=>$(th).text(['Date','Motif','Débit','Crédit','Solde'][i]));
        }
      }
    ],
    ajax:{
      url:'/api/account-transactions',
      data: d=>{
        d.accountType='supplier';
        const p = $('#filterSupplierPeriod').val().split(' - ');
        if(p.length===2){d.from=p[0]; d.to=p[1];}
        d.status = $('#filterSupplierStatus').val();
      }
    },
    columns:[
      { data:'createdAt',    title:'Date' ,width:'15%', orderable:false},
      { data:'income',       title:'Débit',width:'10%', orderable:false,   render:d=>parseFloat(d).toLocaleString() },
      { data:'outcome',      title:'Crédit',width:'10%', orderable:false,  render:d=>parseFloat(d).toLocaleString() },
      { data:'balanceValue', title:'Solde',width:'10%', orderable:false,   render:d=>parseFloat(d).toLocaleString() },
      { data:'reason',   title:'Motif.' ,width:'30%', orderable:false},
      { data:'status',       title:'Statut',width:'10%', orderable:false,  render:s=>`<span class="badge bg-${s==='en attente'?'warning':'success'}">${s}</span>` },
      { data:'id' , title:'',width:'5%', render: renderReceiptButton }
    ],
    pageLength:20,
    lengthMenu:[[20,50,100],[20,50,100]],
    order:[[6,'desc']],
    language:{ url:'/api/datatable_json_fr' }
  });

  // export/print
  $('#btnExportSupplierExcel').on('click', () => supplierTable.button('.buttons-excel').trigger());
  $('#btnExportSupplierPDF').  on('click', () => supplierTable.button('.buttons-pdf').trigger());
  $('#btnPrintSupplier').       on('click', () => supplierTable.button('.buttons-print').trigger());

  // ajout transaction
  $('#formAddSupplier').on('submit', function(e){
    e.preventDefault();
    const $btn = $(this).find('button[type="submit"]');
    if($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const data = $(this).serializeArray().reduce((o,f)=>{ o[f.name]=f.value; return o; }, {});
    const amount = parseFloat(data.amount);
    const payload = {
      createdAt:    data.createdAt,
      income:       data.transactionType==='debit'?amount:0,
      outcome:      data.transactionType==='credit'?amount:0,
      accountType:  'supplier',
      paymentMethod:data.paymentMethod,
      paymentRef:   data.paymentRef,
      status:       'en attente',
      balanceValue: 0,
      describ:      data.describ,
      reason:       data.reason
    };

    $.ajax({
      url:'/api/account-transactions',
      method:'POST',
      contentType:'application/json',
      data:JSON.stringify(payload)
    })
    .done(() => {
      showToastModal({ message:'Transaction ajoutée', type:'success' });
      this.reset();
      supplierTable.ajax.reload();
      loadStats()
      initPendingCount();
    })
    .fail(() => showToastModal({ message:'Erreur ajout transaction', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });
}


/** 3. Section Dépenses **/
function initExpenseSection() {
  $('#filterExpensePeriod').daterangepicker({
    locale: { format:'YYYY-MM-DD' , applyLabel: 'Appliquer',
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
    autoUpdateInput: true
  })
  .on('apply.daterangepicker', (e,p) => {
    $('#filterExpensePeriod')
      .val(p.startDate.format('YYYY-MM-DD') + ' - ' + p.endDate.format('YYYY-MM-DD'));
    expenseTable.ajax.reload();
  })
  .on('cancel.daterangepicker', () => {
    $('#filterExpensePeriod').val('');
    expenseTable.ajax.reload();
  });

  $('#filterExpenseStatus').on('change', () => expenseTable.ajax.reload());
  $('#btnClearExpenseFilters').on('click', () => {
    $('#filterExpensePeriod,#filterExpenseStatus').val('');
    expenseTable.ajax.reload();
  });

  expenseTable = $('#expenseTable').DataTable({
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5', className:'buttons-excel d-none',
        exportOptions:{columns:[0,4,1,2,3]},
        title:'Caisse Dépenses', filename:'Dépenses',
        customizeData:d=>d.header=['Date', 'Motif','Débit','Crédit','Solde']
      },
      {
        extend:'pdfHtml5', className:'buttons-pdf d-none',
        exportOptions:{columns:[0,4,1,2,3]},
        title:'Caisse Dépenses', filename:'Dépenses',
        customize:doc=>{
          doc.content[1].table.headerRows=1;
          doc.content[1].table.body[0]=['Date', 'Motif', 'Débit', 'Crédit','Solde'];
        }
      },
      {
        extend:'print', className:'buttons-print d-none',
        exportOptions:{columns:[0,1,2,3]},
        title:'Caisse Dépenses',
        customize:win=>{
          $(win.document.body).find('table thead tr th')
            .each((i,th)=>$(th).text(['Date','Débit','Crédit','Solde'][i]));
        }
      }
    ],
    ajax:{
      url:'/api/account-transactions',
      data:d=>{
        d.accountType='expense';
        const p = $('#filterExpensePeriod').val().split(' - ');
        if(p.length===2){d.from=p[0];d.to=p[1];}
        d.status = $('#filterExpenseStatus').val();
      }
    },
    columns:[
       { data:'createdAt',    title:'Date' ,width:'15%', orderable:false},
      { data:'income',       title:'Débit',width:'10%', orderable:false,   render:d=>parseFloat(d).toLocaleString() },
      { data:'outcome',      title:'Crédit',width:'10%', orderable:false,  render:d=>parseFloat(d).toLocaleString() },
      { data:'balanceValue', title:'Solde',width:'10%', orderable:false,   render:d=>parseFloat(d).toLocaleString() },
      { data:'reason',   title:'Motif.' ,width:'30%', orderable:false},
      { data:'status',       title:'Statut',width:'10%', orderable:false,  render:s=>`<span class="badge bg-${s==='en attente'?'warning':'success'}">${s}</span>` },
      { data:'id' , title:'',width:'5%', render: renderReceiptButton }
    ],
    pageLength:20,
    lengthMenu:[[20,50,100],[20,50,100]],
    language:{ url:'/api/datatable_json_fr' }
  });

  $('#btnExportExpenseExcel').on('click', () => expenseTable.button('.buttons-excel').trigger());
  $('#btnExportExpensePDF').  on('click', () => expenseTable.button('.buttons-pdf').trigger());
  $('#btnPrintExpense').       on('click', () => expenseTable.button('.buttons-print').trigger());

  $('#formAddExpense').on('submit', function(e){
    e.preventDefault();
    const $btn = $(this).find('button[type="submit"]');
    if($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const data = $(this).serializeArray().reduce((o,f)=>{ o[f.name]=f.value; return o; }, {});
    const amount = parseFloat(data.amount);
    const payload = {
      createdAt:   data.createdAt,
      income:      data.transactionType==='debit'?amount:0,
      outcome:     data.transactionType==='credit'?amount:0,
      accountType: 'expense',
      paymentMethod:data.paymentMethod,
      paymentRef:  data.paymentRef,
      status:      'en attente',
      balanceValue:0,
      describ:     data.describ,
      reason:      data.reason
    };

    $.ajax({
      url:'/api/account-transactions',
      method:'POST',
      contentType:'application/json',
      data:JSON.stringify(payload)
    })
    .done(() => {
      showToastModal({ message:'Transaction ajoutée', type:'success' });
      this.reset();
      expenseTable.ajax.reload();
      initPendingCount();
      loadStats()
    })
    .fail(() => showToastModal({ message:'Erreur ajout transaction', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });
}


/** 4. Transfert Appro → Dépenses **/
function initTransferModal() {
  $('#btnTransferToExpense').on('click', () => {
    $('#form-transfer')[0].reset();
    $('#modalTransfer').modal('show');
  });

  $('#form-transfer').on('submit', function(e){
    e.preventDefault();
    const $btn = $(this).find('button[type="submit"]');
    if($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const payload = {
      amount: parseFloat($(this).find('[name="amount"]').val()),
      reason: $(this).find('[name="reason"]').val()
    };

    $.ajax({
      url: '/api/account-transactions/transfer',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(() => {
      showToastModal({ message:'Transfert effectué', type:'success' });
      $('#modalTransfer').modal('hide');
      supplierTable.ajax.reload();
      expenseTable.ajax.reload();
      loadStats()
      initPendingCount();
    })
    .fail(() => showToastModal({ message:'Erreur transfert', type:'error' }))
    .always(() => $btn.prop('disabled', false));
  });
}


/** 5. Reçu Transaction unique **/
function renderReceiptButton(id) {
  return `<button class="btn btn-sm btn-info btn-receipt" data-id="${id}" title="Reçu">
            <i class="bi bi-receipt"></i>
          </button>`;
}

function initReceiptModal() {
  $('#supplierTable tbody, #expenseTable tbody')
    .off('click', '.btn-receipt')
    .on('click', '.btn-receipt', function(){
      const $btn = $(this);
      if($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const id = $btn.data('id');
      $('#btnPrintReceipt').data('id', id);

      $.get(`/api/account-transactions/${id}`)
        .done(data => {
          $('#receiptContent').html(`
            <dl class="row">
              <dt class="col-sm-4">Date</dt><dd class="col-sm-8">${data.createdAt}</dd>
              <dt class="col-sm-4">Entrée</dt><dd class="col-sm-8">${parseFloat(data.income).toLocaleString()}</dd>
              <dt class="col-sm-4">Sortie</dt><dd class="col-sm-8">${parseFloat(data.outcome).toLocaleString()}</dd>
              <dt class="col-sm-4">Solde</dt><dd class="col-sm-8">${parseFloat(data.balanceValue).toLocaleString()}</dd>
              <dt class="col-sm-4">Mode</dt><dd class="col-sm-8">${data.paymentMethod}</dd>
              <dt class="col-sm-4">Réf. paiement</dt><dd class="col-sm-8">${data.paymentRef}</dd>
              <dt class="col-sm-4">Statut</dt><dd class="col-sm-8">${data.status}</dd>
              <dt class="col-sm-4">Libellé</dt><dd class="col-sm-8">${data.describ}</dd>
              <dt class="col-sm-4">Motif</dt><dd class="col-sm-8">${data.reason}</dd>
            </dl>
          `);
          $('#modalReceipt').modal('show');
        })
        .fail(() => showToastModal({ message:'Impossible de charger le reçu', type:'error' }))
        .always(() => $btn.prop('disabled', false));
    });

  $('#btnPrintReceipt').off('click').on('click', function(){
    const id = $(this).data('id');
    window.open(`/transaction/${id}/print`, '_blank');
  });
}
