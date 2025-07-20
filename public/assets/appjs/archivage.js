// assets/js/archive_table.js

$(document).ready(function() {
  // 1. Date range picker
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
    startDate: firstDay,
    endDate: lastDay,
    autoUpdateInput: true
  });
  $('#filter-date').val(
    firstDay.toISOString().slice(0,10) +
    ' - ' +
    lastDay.toISOString().slice(0,10)
  );

  // 2. DataTable with server-side processing
  $.fn.dataTable.ext.type.order['date-fr-pre'] = function(d) {
    if (!d) return 0;
    const parts = d.split(' ');
    if (parts.length < 3) return 0;
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const day   = parseInt(parts[0], 10);
    const month = months.indexOf(parts[1].toLowerCase());
    const year  = parseInt(parts[2], 10);
    if (isNaN(day)||month<0||isNaN(year)) return 0;
    return new Date(year, month, day).getTime();
  };

  const table = $('#archive-table').DataTable({
    dom: 'Bflrtip',
    processing: true,
    serverSide: true, 
    buttons: [
      {
        extend: 'excelHtml5',
        className: 'buttons-excel btn-outline-success d-none', // Caché, déclenché par votre bouton externe
        title: 'Archives',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      },
      {
        extend: 'pdfHtml5',
        className: 'buttons-pdf btn-outline-danger d-none', // Caché, déclenché par votre bouton externe
        title: 'Archives',
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      }
    ],
    ajax: {
      url: '/api/archives',
      data: d => {
        d.dateRange   = $('#filter-date').val();
        d.archivist   = $('#filter-archivist').val();
        d.bureauDepos = $('#filter-bureau').val();
      }
    },
    columns: [
      { data: 'reference' },
      { data: 'dateReception', type: 'date-fr' },
      { data: 'dateArchiving', type: 'date-fr' },
      { data: 'bureauDepos' },
      { data: 'archivistName' },
      { data: 'cote' },
      { data: 'archivingNotes' },
      {
        data: null, orderable: false,
        render: row => `
          <div class="btn-group">
            <button class="btn btn-sm btn-info btn-view-archive" data-id="${row.id}" data-docId="${row.docId}" title="Voir">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning btn-export-pdf" data-id="${row.docId}" title="PDF">
              <i class="bi bi-file-earmark-pdf"></i>
            </button>
            <button class="btn btn-sm btn-success btn-export-excel" data-id="${row.docId}" title="Excel">
              <i class="bi bi-file-earmark-excel"></i>
            </button> 
            <button class="btn btn-sm btn-danger btn-delete-archive" data-id="${row.id}" title="Suppr.">
              <i class="bi bi-trash"></i>
            </button>
          </div>`
      }
    ],
    language: { url: '/api/datatable_json_fr' }
  });

  $('#archive-table')
    .addClass('border-top border-bottom table-striped')
    .on('change keyup', '#filter-date, #filter-archivist, #filter-bureau', () => table.ajax.reload());

  // 3. View details (disable button to prevent double request)
  $('#archive-table').on('click', '.btn-view-archive', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    $('#viewOriginalDossier').data('id', id);
    $.ajax({
      url: `/api/archives/${id}`,
      method: 'GET'
    })
    .done(function(d) {
      $('#viewRef')       .text(d.reference);
      $('#viewDateRec')   .text(d.dateReception);
      $('#viewDateArch')  .text(d.dateArchiving);
      $('#viewBureau')    .text(d.bureauDepos);
      $('#viewArchivist') .text(d.archivistName);
      $('#viewCote')      .text(d.cote);
      $('#viewNotes')     .text(d.archivingNotes);
      $('#viewArchiveModal').modal('show');
    })
    .fail(function() {
      showToastModal({ message: 'Échec chargement détails', type: 'error' });
    })
    .always(function() {
      $btn.prop('disabled', false);
    });
  }); 

  $('#viewOriginalDossier').on('click', function() {  
    const url =  `/dashboard/dossiers/${$(this).data('id')}` 
    window.open(url, '_blank'); 
  });

  // 4. Export PDF/Excel (disable momentarily)
  $('#archive-table').on('click', '.btn-export-pdf, .btn-export-excel', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    const isPdf = $btn.hasClass('btn-export-pdf');
    const url = isPdf
      ? `/api/dossiers/${$(this).data('id')}/export/pdf`
      : `/api/archives/${id}/export/xlsx`;

    window.open(url, '_blank');

    // re-enable after a short delay
    setTimeout(() => $btn.prop('disabled', false), 1000);
  });

  // 5. Delete archive (via confirm button)
  $('#archive-table').on('click', '.btn-delete-archive', function() {
    const id = $(this).data('id');
    $('#deleteArchiveId').val(id);
    $('#confirmDeleteArchiveModal').modal('show');
  });

  $('#confirmDeleteArchiveBtn').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $('#deleteArchiveId').val();
    $.ajax({
      url: `/api/archives/${id}`,
      method: 'DELETE'
    })
    .done(function() {
      $('#confirmDeleteArchiveModal').modal('hide');
      table.ajax.reload();
      showToastModal({ message: 'Archive supprimée', type: 'success' });
    })
    .fail(function() {
      showToastModal({ message: 'Échec suppression archive', type: 'error' });
    })
    .always(function() {
      $btn.prop('disabled', false);
    });
  });
});
