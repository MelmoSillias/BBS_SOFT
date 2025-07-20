// public/assets/appjs/dossiers.js

$(function() {
  let table;
  let currentId;
  let docIndex = 1;

  // 1. Date range picker
  $('#filter-date').daterangepicker({
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
  .on('apply.daterangepicker', function(ev, p) {
    $(this).val(p.startDate.format('YYYY-MM-DD') + ' - ' + p.endDate.format('YYYY-MM-DD'));
    table.ajax.reload();
  })
  .on('cancel.daterangepicker', function() {
    $(this).val('');
    table.ajax.reload();
  });

  // 2. DataTable initialization
  table = $('#dossier-table').DataTable({
    processing: true,
    serverSide: true, dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        className: 'buttons-excel btn-outline-success d-none', // Caché, déclenché par votre bouton externe
        title: 'Liste des Dossiers',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6] } // Ajustez les index des colonnes
      },
      {
        extend: 'pdfHtml5',
        className: 'buttons-pdf btn-outline-danger d-none', // Caché, déclenché par votre bouton externe
        title: 'Liste des Dossiers',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6] } // Ajustez les index des colonnes
      }
    ],
    ajax: {
      url: '/api/dossiers',
      data: d => {
        d.dateRange = $('#filter-date').val();
        d.urgency   = $('#filter-urgency').val();
        d.status    = $('#filter-status').val();
      }
    },
    columns: [
      { data: 'reference' },
      { data: 'senderName' },
      { data: 'dateReception' },
      { 
        data: 'urgency',
        render: u => {
          const b = badgeLabel('urgency', u);
          return `<span class="badge bg-${b.class}">${b.label}</span>`;
        }
      },
      { data: 'owner' },
      {
        data: 'status',
        render: s => {
          const b = badgeLabel('status', s);
          return `<span class="badge bg-${b.class}">${b.label}</span>`;
        }
      },
      {
        data: null,
        orderable: false,
        render: row => actionsRenderer(row)
      }
    ],
    pageLength: 20,
    lengthMenu: [[20,50,100],[20,50,100]],
    language: { url: '/api/datatable_json_fr' }
  });

  $('#dossier-table').addClass('border-top border-bottom table-striped');

  // 3. Reload on filter change
  $('#filter-urgency, #filter-status').on('change', () => table.ajax.reload());

  // 4. Dynamic documents add/remove
  $('#add-document-btn').off('click').on('click', () => {
    const $first = $('.document-item').first();
    const $clone = $first.clone();
    $clone.find('input, select').each(function() {
      const name = $(this).attr('name').replace(/\[\d+\]/, `[${docIndex}]`);
      $(this).attr('name', name).val('');
    });
    $('#documents-wrapper .card-body').append($clone);
    docIndex++;
  });

  $('#documents-wrapper').off('click', '.btn-remove-document').on('click', '.btn-remove-document', function() {
    if ($('.document-item').length > 1) {
      $(this).closest('.document-item').remove();
    }
  });

  // 5. Form submission
  $('#formAddDossier').off('submit').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const fd = new FormData();
    // Dossier fields
    ['senderName','sender','senderContact','dateReception','modeTransmission','urgency','primaryRecipient','generalObservations']
      .forEach(f => fd.append(f, $form.find(`#${f}`).val() || ''));

    // Documents
    $('.document-item').each((i, el) => {
      const $el = $(el);
      ['description','numberOfCopies','numberOfPages','documentDate','supportingDocuments','notes']
        .forEach(field => {
          fd.append(`documents[${i}][${field}]`, $el.find(`[name$="[${field}]"]`).val() || '');
        });
      // multiple files
      const files = $el.find('[name$="[attachedFiles][]"]')[0].files;
      Array.from(files).forEach(file => {
        fd.append(`documents[${i}][attachedFiles][]`, file);
      });
    });

    fetch('/api/dossiers', { method:'POST', body: fd })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => {
        showToastModal({ message:'Dossier créé', type:'success' });
        $form[0].reset();
        $('.document-item').slice(1).remove();
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur création', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // 6. Delegated row actions

  // ASSIGN
  $('#dossier-table').off('click', '.btn-assign').on('click', '.btn-assign', function() {
    currentId = $(this).data('id');
    $('#assignDossierId, #assignOwner').val('');
    $('#assignModal').modal('show');
  });
  $('#confirmAssignBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const owner = $('#assignOwner').val();
    if (!owner) return;
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}/assign`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ owner })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#assignModal').modal('hide');
        showToastModal({ message:'Dossier affecté', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur affectation', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // REASSIGN
  $('#dossier-table').off('click', '.btn-reassign').on('click', '.btn-reassign', function() {
    currentId = $(this).data('id');
    $('#reassignDossierId, #reassignOwner').val('');
    $('#reassignModal').modal('show');
  });
  $('#confirmReassignBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const owner = $('#reassignOwner').val();
    if (!owner) return;
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}/reassign`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ owner })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#reassignModal').modal('hide');
        showToastModal({ message:'Dossier réaffecté', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur réaffectation', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // TRANSFER
  $('#dossier-table').off('click', '.btn-transfer').on('click', '.btn-transfer', function() {
    currentId = $(this).data('id');
    $('#transferDossierId')[0].value = currentId;
    $('#formTransferModal')[0].reset();
    $('#transferModal').modal('show');
  });
  $('#confirmTransferBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const payload = {
      date:                $('#transferDate').val(),
      destination:         $('#transferDestination').val(),
      motif:               $('#transferMotif').val(),
      transferResponsible: $('#transferResponsible').val()
    };
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}/transfer`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#transferModal').modal('hide');
        showToastModal({ message:'Transfert effectué', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur transfert', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // ARCHIVE
  $('#dossier-table').off('click', '.btn-archive').on('click', '.btn-archive', function() {
    currentId = $(this).data('id');
    $('#formArchiveModal')[0].reset();
    $('#archiveModal').modal('show');
  });
  $('#confirmArchiveBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const payload = {
      dateArchiving: $('#archiveDate').val(),
      bureauDepos:   $('#archiveBureau').val(),
      archivist:     $('#archiveArchivist').val(),
      cote:          $('#archiveCote').val(),
      archivingNotes:$('#archiveNotes').val()
    };
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}/archive`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#archiveModal').modal('hide');
        showToastModal({ message:'Archivage effectué', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur archivage', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // EDIT
  $('#dossier-table').off('click', '.btn-edit').on('click', '.btn-edit', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    currentId = $(this).data('id');
    fetch(`/api/dossiers/${currentId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        $('#editDossierId').val(data.id);
        $('#editReference').val(data.reference);
        $('#editSenderName').val(data.senderName);
        $('#editSenderContact').val(data.senderContact || '');
        $('#editDateReception').val(data.dateReception);
        $('#editModeTransmission').val(data.modeTransmission);
        $('#editUrgency').val(data.urgency);
        $('#editSender').val(data.sender || '');
        $('#editPrimaryRecipient').val(data.primaryRecipient || '');
        $('#editOwner').val(data.owner || '');
        $('#editGeneralObservations').val(data.generalObservations || '');
        $('#editModal').modal('show');
      })
      .catch(() => showToastModal({ message:'Impossible de charger les données', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });
  $('#confirmEditBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const payload = {
      reference:           $('#editReference').val(),
      senderName:          $('#editSenderName').val(),
      senderContact:       $('#editSenderContact').val(),
      dateReception:       $('#editDateReception').val(),
      modeTransmission:    $('#editModeTransmission').val(),
      urgency:             $('#editUrgency').val(),
      sender:              $('#editSender').val(),
      primaryRecipient:    $('#editPrimaryRecipient').val(),
      owner:               $('#editOwner').val(),
      generalObservations: $('#editGeneralObservations').val()
    };
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}`, {
      method: 'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#editModal').modal('hide');
        showToastModal({ message:'Données mises à jour', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur mise à jour', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // CHANGE URGENCY
  $('#dossier-table').off('click', '.btn-change-urgency').on('click', '.btn-change-urgency', function() {
    currentId = $(this).data('id');
    $('#newUrgency').val('');
    $('#urgencyModal').modal('show');
  });
  $('#confirmUrgencyBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const urgency = $('#newUrgency').val();
    if (!urgency) return;
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${currentId}/change-urgency`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ urgency })
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#urgencyModal').modal('hide');
        showToastModal({ message:'Urgence mise à jour', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur mise à jour urgence', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // EXPORT PDF/Excel
  $('#dossier-table').off('click', '.btn-export-pdf').on('click', '.btn-export-pdf', function() {
    window.open(`/api/dossiers/${$(this).data('id')}/export/pdf`, '_blank');
  });
  $('#dossier-table').off('click', '.btn-export-excel').on('click', '.btn-export-excel', function() {
    window.open(`/api/dossiers/${$(this).data('id')}/export/xlsx`, '_blank');
  });

  // DELETE
  $('#dossier-table').off('click', '.btn-delete').on('click', '.btn-delete', function() {
    currentId = $(this).data('id');
    $('#deleteDossierId').val(currentId);
    $('#confirmDeleteModal').modal('show');
  });
  $('#confirmDeleteBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const id = $('#deleteDossierId').val();
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${id}`, { method:'DELETE' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#confirmDeleteModal').modal('hide');
        showToastModal({ message:'Dossier supprimé', type:'success' });
        table.ajax.reload();
      })
      .catch(() => {
        $('#confirmDeleteModal').modal('hide');
        showToastModal({ message:'Erreur suppression', type:'error' });
      })
      .finally(() => $btn.prop('disabled', false));
  });

  // VALIDATE
  $('#dossier-table').off('click', '.btn-validate').on('click', '.btn-validate', function() {
    currentId = $(this).data('id');
    $('#validateDossierId').val(currentId);
    $('#confirmValidateModal').modal('show');
  });
  $('#confirmValidateBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    const id = $('#validateDossierId').val();
    $btn.prop('disabled', true);
    fetch(`/api/dossiers/${id}/validate`, { method:'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        $('#confirmValidateModal').modal('hide');
        showToastModal({ message:'Dossier validé', type:'success' });
        table.ajax.reload();
      })
      .catch(() => showToastModal({ message:'Erreur validation', type:'error' }))
      .finally(() => $btn.prop('disabled', false));
  });
  

  // Utility: badge label
  function badgeLabel(type, key) {
    const maps = {
      urgency: {
        low:    {class:'secondary', label:'Faible'},
        medium: {class:'warning',   label:'Moyenne'},
        high:   {class:'danger',    label:'Haute'}
      },
      status: {
        received:      {class:'info',      label:'Reçu'},
        in_processing: {class:'primary',   label:'En traitement'},
        validated:     {class:'success',   label:'Validé'},
        archived:      {class:'secondary', label:'Archivé'}
      }
    };
    return (maps[type] && maps[type][key]) || {class:'light', label:key};
  }

  // Utility: actions renderer
  function actionsRenderer(row) {
    const viewBtn      = `<a href="/dashboard/dossiers/${row.id}" class="dropdown-item"><i class="bi bi-eye"></i> Voir</a>`;
    const assignBtn    = `<button data-id="${row.id}" class="dropdown-item btn-assign"><i class="bi bi-person-plus"></i> Affecter</button>`;
    const reassignBtn  = `<button data-id="${row.id}" class="dropdown-item btn-reassign"><i class="bi bi-arrow-repeat"></i> Réaffecter</button>`;
    const editBtn      = `<button data-id="${row.id}" class="dropdown-item btn-edit"><i class="bi bi-pencil"></i> Modifier</button>`;
    const validateBtn = `<button data-id="${row.id}" class="dropdown-item btn-validate"><i class="bi bi-check-all"></i> Valider</button>`; 
    const deleteBtn    = `<button data-id="${row.id}" class="dropdown-item btn-delete"><i class="bi bi-trash"></i> Supprimer</button>`;
    const transferBtn  = `<button data-id="${row.id}" class="dropdown-item btn-transfer"><i class="bi bi-upload"></i> Transférer</button>`;
    const archiveBtn   = `<button data-id="${row.id}" class="dropdown-item btn-archive"><i class="bi bi-archive"></i> Archiver</button>`;
    const exportPdfBtn = `<button data-id="${row.id}" class="dropdown-item btn-export-pdf"><i class="bi bi-file-earmark-pdf"></i> Export PDF</button>`;
    const exportXlsBtn = `<button data-id="${row.id}" class="dropdown-item btn-export-excel"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>`;
    const changeUrgBtn = `<button data-id="${row.id}" class="dropdown-item btn-change-urgency"><i class="bi bi-exclamation-circle"></i> Changer urgence</button>`;

    let items = [];
    switch(row.status) {
      case 'received':      items = [assignBtn, changeUrgBtn, editBtn, viewBtn, deleteBtn, transferBtn, exportPdfBtn, exportXlsBtn]; break;
      case 'in_processing': items = [viewBtn, reassignBtn, changeUrgBtn, validateBtn, exportPdfBtn, exportXlsBtn]; break;
      case 'validated':     items = [viewBtn, archiveBtn, exportPdfBtn, exportXlsBtn]; break;
      case 'archived':      items = [viewBtn, transferBtn, exportPdfBtn, exportXlsBtn]; break;
      default:              items = [viewBtn];
    }
    return `
      <div class="dropdown">
        <button class="btn btn-sm btn-light dropdown-toggle" data-bs-toggle="dropdown">
          Actions
        </button>
        <ul class="dropdown-menu">${items.join('')}</ul>
      </div>
    `;
  }
});
