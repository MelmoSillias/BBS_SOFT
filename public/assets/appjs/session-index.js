// public/assets/appjs/sessions.js

$(function() {
  let tableView = true;
  let table, cardContainer;
  let deleteSessionId = null;

  // 1. Date range picker
  const now       = new Date();
  const firstDay  = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  $('#filterCreated').daterangepicker({
    locale: {
      format:       'YYYY-MM-DD',
      applyLabel:   'Appliquer',
      cancelLabel:  'Annuler',
      fromLabel:    'De',
      toLabel:      'À',
      customRangeLabel: 'Personnalisé',
      daysOfWeek:   ['Di','Lu','Ma','Me','Je','Ve','Sa'],
      monthNames:   ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],
      firstDay:     1
    },
    autoUpdateInput: true,
    startDate: firstDay,
    endDate:   lastDay
  })
  .on('apply.daterangepicker', (ev, picker) => {
    $('#filterCreated')
      .val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    loadTable();
  })
  .on('cancel.daterangepicker', () => {
    $('#filterCreated').val('');
    loadTable();
  });

  // 2. Set up containers & toggle button
  table = initDataTable();
  cardContainer = $('#session-cards-container');
  $('#toggleSessionViewBtn').on('click', toggleView);

  // 3. Filters reload
  $('#searchName, #filterCreated').on('keyup change', () => {
    if (tableView) table.ajax.reload();
    else loadCards();
  });

  // 4. New session modal
  $('#btnNewSession').on('click', () => $('#createSessionModal').modal('show'));
  $('#createSessionForm').on('submit', e => {
    e.preventDefault();
    const $btn = $('#createSessionForm button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const payload = {
      name:        $('#sessionName').val(),
      description: $('#createSessionDescription').val()
    };
    $.ajax({
      url: '/api/sessions',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload)
    })
    .done(() => {
      $('#createSessionModal').modal('hide');
      showToastModal({ message: 'Nouvelle session créée', type: 'success' });
      reloadView();
    })
    .fail(() => showToastModal({ message: 'Erreur création', type: 'error' }))
    .always(() => $btn.prop('disabled', false));
  });

  // 5. Delete session
  $('#session-table tbody').on('click', '.btn-delete-session', function() {
    deleteSessionId = $(this).data('id');
    $('#deleteSessionId').val(deleteSessionId);
    $('#confirmDeleteSessionModal').modal('show');
  });
  $('#confirmDeleteSessionBtn').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $('#deleteSessionId').val();
    fetch(`/api/sessions/${id}`, { method: 'DELETE' })
      .then(r => {
        if (!r.ok) throw r;
        return r.json();
      })
      .then(() => {
        $('#confirmDeleteSessionModal').modal('hide');
        showToastModal({ message: 'Session supprimée', type: 'success' });
        reloadView();
      })
      .catch(() => showToastModal({ message: 'Erreur suppression', type: 'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // 6. View session details
  $('#session-table tbody, #session-cards-container').on('click', '.btn-view-session', function() {
    const id = $(this).data('id');
    window.location.href = `/dashboard/session/${id}`;
  });

  // INITIAL LOAD
  reloadView();

  // ─── Functions ───────────────────────────────────────────────

  function initDataTable() {
    return $('#session-table').DataTable({
      processing: true,
      serverSide: true,dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        className: 'buttons-excel btn-outline-success d-none', // Caché, déclenché par votre bouton externe
        title: `Liste des sessions`,
        exportOptions: { columns: [0, 1, 2, ] } // Ajustez les index des colonnes
      },
      {
        extend: 'pdfHtml5',
        className: 'buttons-pdf btn-outline-danger d-none', // Caché, déclenché par votre bouton externe
        title: `Liste des session`,
        exportOptions: { columns: [0, 1, 2 ] } // Ajustez les index des colonnes
      }
    ],
      ajax: {
        url: '/api/sessions',
        data: d => {
          d.name      = $('#searchName').val();
          d.dateRange = $('#filterCreated').val();
        }
      },
      columns: [
        { data: 'id' },
        { data: 'name' },
        { data: 'createdAt' },
        { data: 'taskCount', orderable: false },
        {
          data: null, orderable: false,
          render: row => `
            <div class="btn-group">
              <button class="btn btn-sm btn-light btn-view-session" data-id="${row.id}" title="Voir">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-sm btn-danger btn-delete-session" data-id="${row.id}" title="Supprimer">
                <i class="bi bi-trash"></i>
              </button>
            </div>`
        }
      ],
      order: [[2, 'desc']],
      language: { url: '/api/datatable_json_fr' }
    });
  }

  function loadTable() {
    tableView = true;
    $('#session-list-view').show();
    $('#session-cards-view').hide();
    table.ajax.reload();
  }

  function loadCards() {
    tableView = false;
    $('#session-list-view').hide();
    $('#session-cards-view').show();
    const params = {
      name: $('#searchName').val(),
      dateRange: $('#filterCreated').val()
    };
    $.get('/api/sessions', params)
      .done(list => {
        cardContainer.empty();
        if (!Array.isArray(list) || !list.length) {
          cardContainer.append('<div class="text-center text-muted">Aucune session</div>');
          return;
        }
        list.forEach(s => {
          const $card = $(`
            <div class="card mb-3 session-card" data-id="${s.id}">
              <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">${s.name}</h5>
                  <small class="text-muted">${s.createdAt}</small>
                </div>
                <button class="btn btn-sm btn-light btn-view-session" data-id="${s.id}">
                  <i class="bi bi-eye"></i>
                </button>
              </div>
              <div class="card-body">
                <ul class="list-group list-group-flush">
                  <li class="list-group-item">Tâches totales: ${s.taskCount}</li>
                </ul>
              </div>
            </div>
          `);
          cardContainer.append($card);
        });
      })
      .fail(() => showToastModal({ message: 'Erreur chargement sessions', type: 'error' }));
  }

  function toggleView() {
    if (tableView) loadCards();
    else loadTable();
  }

  function reloadView() {
    if (tableView) table.ajax.reload();
    else loadCards();
  }
});
