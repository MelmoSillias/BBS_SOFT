$(function() {
  let table;
  let currentTaskId;
  let cardLoaded = false;
  const sessionId = $('#sessionContainer').data('id');

  function updateSessionStats() {
    $.ajax({
      url: `/api/sessions/${sessionId}/stats`,
      method: 'GET',
      dataType: 'json'
    })
    .done(stats => {
      $('#sessionStats .info-box-number').text('--'); // Reset
      $('#sessionStats .col-md-6:nth-child(1) .info-box-number').text(stats.total);
      $('#sessionStats .col-md-6:nth-child(2) .info-box-number').text(stats.open);
      $('#sessionStats .col-md-6:nth-child(3) .info-box-number').text(stats.waiting);
      $('#sessionStats .col-md-6:nth-child(4) .info-box-number').text(stats.validated);
      $('#sessionStats .col-md-6:nth-child(5) .info-box-number').text(stats.rejected);
    })
    .fail(() => showToastModal({ message:'Erreur chargement stats', type:'error' }));
  }
  updateSessionStats();
 
  // 1. DateRangePicker for deadline filter
  $('#filterDeadline').daterangepicker({
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
    endDate: moment().endOf('month'), 
    autoUpdateInput: false
  })
  .on('apply.daterangepicker', (e, picker) => {
    $('#filterDeadline')
      .val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
    table.ajax.reload();
  })
  .on('cancel.daterangepicker', () => {
    $('#filterDeadline').val('');
    table.ajax.reload();
  });

  // 2. Initialize DataTable
  table = $('#task-table').DataTable({
    processing: true,
    serverSide: true, dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        className: 'buttons-excel btn-outline-success d-none', // Caché, déclenché par votre bouton externe
        title: `Liste des tâches TAF N° ${sessionId}`,
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      },
      {
        extend: 'pdfHtml5',
        className: 'buttons-pdf btn-outline-danger d-none', // Caché, déclenché par votre bouton externe
        title: `Liste des tâches TAF N° ${sessionId}`,
        exportOptions: { columns: [0, 1, 2, 3, 4, 5] } // Ajustez les index des colonnes
      }
    ],
    ajax: {
      url: `/api/sessions/${sessionId}/tasks`,
      data: d => {
        d.title     = $('#searchTitle').val();
        d.dateRange = $('#filterDeadline').val();
        d.urgency   = $('#filterUrgency').val();
        d.status    = $('#filterStatus').val();
      }
    },
    columns: [
      { data:'id',    title: 'ID' },
      { data:'title', title: 'Titre' },
      { data:'assigneeName', title: 'Assigné à' },
      { data:'deadline',     title: 'Échéance' },
      {
        data:'urgency',
        title:'Urgence',
        render: u => {
          const labels  = { low:'Faible', medium:'Moyenne', high:'Haute' };
          const classes = { low:'secondary', medium:'warning', high:'danger' };
          return `<span class="badge bg-${classes[u]||'secondary'}">${labels[u]||u}</span>`;
        }
      },
      {
        data:'status',
        title:'Statut',
        render: s => {
          const labels  = {
            open:'En cours',
            waiting_validation:'En attente de validation',
            validated:'Validée',
            rejected:'Rejetée'
          };
          const classes = {
            open:'info',
            waiting_validation:'warning',
            validated:'success',
            rejected:'danger'
          };
          return `<span class="badge bg-${classes[s]||'light'}">${labels[s]||s.replace('_',' ')}</span>`;
        }
      },
      {
        data:null, orderable:false,
        render: row => {
          let btns = [
           `<button class="btn btn-sm btn-light btn-view" data-id="${row.id}" title="Voir"><i class="bi bi-eye"></i></button>`
          ];
          if (row.status === 'open') { 
              btns.push(`<button class="btn btn-sm btn-light btn-edit" data-id="${row.id}" title="Éditer"><i class="bi bi-pencil"></i></button>`);
              btns.push(`<button class="btn btn-sm btn-danger btn-delete" data-id="${row.id}" title="Supprimer"><i class="bi bi-trash"></i></button>`);
          } else if (row.status === 'waiting_validation') {   
            btns.push(`<button class="btn btn-sm btn-success btn-validate" data-id="${row.id}" title="Valider"><i class="bi bi-hand-thumbs-up"></i></button>`);
            btns.push(`<button class="btn btn-sm btn-danger btn-reject"  data-id="${row.id}" title="Rejeter"><i class="bi bi-hand-thumbs-down"></i></button>`);
          } 
         
          return `<div class="btn-group">${btns.join('')}</div>`;
        }
      }
    ],
    order: [[3,'asc']],
    language: { url: '/api/datatable_json_fr' }
  });
  $('#task-table').addClass('table-striped table-bordered border-top border-bottom');

  // 3. Filters for title, urgency, status
  $('#searchTitle, #filterUrgency, #filterStatus')
    .on('keyup change', () => table.ajax.reload());

  // 4. Add/Edit task modal
  $('#btnAddTask').on('click', () => {
    $('#formTask')[0].reset();
    $('#taskId').val('');
    $('#taskStatus').val('open');
    $('#taskModal').modal('show');
  });
  $('#task-table').on('click', '.btn-edit', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    currentTaskId = $btn.data('id');

    $.ajax({
      url: `/api/tasks/${currentTaskId}`,
      method: 'GET',
      success: function(data) {
        $('#taskId').val(data.id);
        $('#taskTitle').val(data.title);
        $('#taskAssignee').val(data.assigneeId||'');
        $('#taskDeadline').val(data.deadline||'');
        $('#taskUrgency').val(data.urgency);
        $('#taskStatus').val(data.status);
        $('#taskDesc').val(data.description||'');
        $('#taskModal').modal('show');
      },
      error: function() {
        showToastModal({ message:'Impossible de charger la tâche', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });
  $('#formTask').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $('#taskId').val();
    const url = id ? `/api/tasks/${id}` : `/api/sessions/${sessionId}/tasks`;
    const method = id ? 'PUT' : 'POST';
    const payload = {
      title:       $('#taskTitle').val(),
      assigneeId:  $('#taskAssignee').val(),
      deadline:    $('#taskDeadline').val(),
      urgency:     $('#taskUrgency').val(),
      status:      $('#taskStatus').val(),
      description: $('#taskDesc').val()
    };

    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function() {
        $('#taskModal').modal('hide');
        showToastModal({ message: id ? 'Tâche mise à jour' : 'Tâche créée', type:'success' });
        table.ajax.reload();
        cardLoaded = false;
      },
      error: function() {
        showToastModal({ message:'Erreur sauvegarde', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  // 5. Complete task
  $('#task-table').on('click', '.btn-complete', function() {
    currentTaskId = $(this).data('id');
    $('#confirmCompleteTaskModal').modal('show');
  });
  $('#confirmCompleteTaskBtn').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/tasks/${currentTaskId}/complete`,
      method: 'POST',
      success: function() {
        $('#confirmCompleteTaskModal').modal('hide');
        showToastModal({ message:'Tâche marquée terminée', type:'success' });
        table.ajax.reload();
        cardLoaded = false;
        updateSessionStats()
      },
      error: function() {
        showToastModal({ message:'Erreur', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  // 6. Validate / Reject
  $('#task-table').on('click', '.btn-validate, .btn-reject', function() {
    const action = $(this).hasClass('btn-validate') ? 'validate' : 'reject';
    currentTaskId = $(this).data('id');
    $('#validateTaskModal').data('action', action).modal('show');
  });
  $('#validateTaskBtn, #rejectTaskBtn').off('click').on('click', function() {
    const action = $('#validateTaskModal').data('action');
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/tasks/${currentTaskId}/${action}`,
      method: 'POST',
      success: function() {
        $('#validateTaskModal').modal('hide');
        showToastModal({ message: action === 'validate' ? 'Tâche validée' : 'Tâche rejetée', type:'success' });
        table.ajax.reload();
        cardLoaded = false;
        updateSessionStats()
      },
      error: function() {
        showToastModal({ message:'Erreur', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  // 7. Delete
  $('#task-table').on('click', '.btn-delete', function() {
    currentTaskId = $(this).data('id');
    $('#confirmDeleteTaskModal').modal('show');
  });
  $('#confirmDeleteTaskBtn').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/tasks/${currentTaskId}`,
      method: 'DELETE',
      success: function() {
        $('#confirmDeleteTaskModal').modal('hide');
        showToastModal({ message:'Tâche supprimée', type:'success' });
        table.ajax.reload();
        cardLoaded = false;
        updateSessionStats()
      },
      error: function() {
        showToastModal({ message:'Erreur', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  // 8. View details
  $('#task-table').on('click', '.btn-view', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $btn.data('id');

    $.ajax({
      url: `/api/tasks/${id}`,
      method: 'GET',
      success: function(d) {
        $('#viewTaskTitle').text(d.title);
        $('#viewTaskAssignee').text(d.assigneeName||'Non assigné');
        $('#viewTaskDeadline').text(d.deadline||'-');
        $('#viewTaskUrgency').text(d.urgency);
        $('#viewTaskStatus').text(d.status);
        $('#viewTaskDesc').text(d.description||'Aucune description.');
        $('#viewTaskModal').modal('show');
      },
      error: function() {
        showToastModal({ message:'Erreur chargement', type:'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  // 9. Toggle Table/Card view
  const $tableViewBtn = $('#toggleTableView');
  const $cardViewBtn  = $('#toggleCardView');
  const $tableView    = $('#tableView');
  const $cardView     = $('#cardView');

  $tableViewBtn.addClass('active');
  $cardView.hide();

  $tableViewBtn.on('click', () => {
    $tableViewBtn.addClass('active');
    $cardViewBtn.removeClass('active');
    $cardView.hide();
    $tableView.show();
  });
  $cardViewBtn.on('click', () => {
    $cardViewBtn.addClass('active');
    $tableViewBtn.removeClass('active');
    $tableView.hide();
    $cardView.show(); loadCardView();
  });

  function loadCardView() {
  $.ajax({
    url: `/api/sessions/${sessionId}/tasksbyuser`,
    method: 'GET',
    dataType: 'json'
  })
  .done(res => {
    const byUser = res.data || {};
    const $acc   = $('#usersAccordion').empty();

    USERS_LIST.forEach(user => {
      const tasks = byUser[user.id] || [];

      // Stats
      const stats = {
        total:     tasks.length,
        open:      tasks.filter(t => t.status === 'open').length,
        waiting:   tasks.filter(t => t.status === 'waiting_validation').length,
        validated: tasks.filter(t => t.status === 'validated').length,
        rejected:  tasks.filter(t => t.status === 'rejected').length
      };

      // Génération du HTML des tâches
      const tasksHtml = tasks.length
        ? tasks.map(t => {
            // Boutons selon status (copié du render DT)
            const btns = [
              `<button class="btn btn-sm btn-light btn-view" data-id="${t.id}" title="Voir"><i class="bi bi-eye"></i></button>`
            ];
            if (t.status === 'open') {
              btns.push(`<button class="btn btn-sm btn-light btn-edit"   data-id="${t.id}" title="Éditer"><i class="bi bi-pencil"></i></button>`);
              btns.push(`<button class="btn btn-sm btn-danger btn-delete" data-id="${t.id}" title="Supprimer"><i class="bi bi-trash"></i></button>`);
            } else if (t.status === 'waiting_validation') {
              btns.push(`<button class="btn btn-sm btn-success btn-validate" data-id="${t.id}" title="Valider"><i class="bi bi-hand-thumbs-up"></i></button>`);
              btns.push(`<button class="btn btn-sm btn-danger  btn-reject"   data-id="${t.id}" title="Rejeter"><i class="bi bi-hand-thumbs-down"></i></button>`);
            }
            return `
              <div class="card mb-2">
                <div class="card-body d-flex justify-content-between">
                  <div>
                    <h6 class="mb-1">${t.title}</h6>
                    <small class="text-muted">
                      Échéance: ${t.deadline||'-'} |
                      <span class="badge bg-${
                        {open:'info',waiting_validation:'warning',validated:'success',rejected:'danger'}[t.status]
                      }">${
                        {open:'En cours',waiting_validation:'En attente de validation',validated:'Validée',rejected:'Rejetée'}[t.status]
                      }</span>
                    </small>
                    ${t.description ? `<p class="mt-1 small">${t.description}</p>` : ''}
                  </div>
                  <div class="btn-group gap-2" style="height : 30px;">
                    ${btns.join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')
        : `<li class="list-group-item text-muted">Aucune tâche.</li>`;

      // Construction de la carte utilisateur
      const cardHtml = `
        <div class="card user-card mb-3">
          <div class="card-header d-flex justify-content-between align-items-center" id="heading-${user.id}">
            <button class="btn flex-grow-1 text-start d-flex align-items-center"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#collapse-${user.id}"
                    aria-expanded="false"
                    aria-controls="collapse-${user.id}">
              <span class="fw-bold"><i class="bi bi-person-circle"></i> ${user.fullName}</span>
              <div class="d-flex flex-wrap gap-3 mx-4 stats text-muted">
                <span>Total: <strong class="stat-total text-primary">${stats.total}</strong></span>
                <span>Ouvert: <strong class="stat-open text-info">${stats.open}</strong></span>
                <span>En attente: <strong class="stat-waiting text-secondary">${stats.waiting}</strong></span>
                <span>Validé: <strong class="stat-validated text-success">${stats.validated}</strong></span>
                <span>Rejeté: <strong class="stat-rejected text-danger">${stats.rejected}</strong></span>
              </div>
            </button>
            <button class="btn btn-sm btn-primary btn-add-task" data-user-id="${user.id}">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
          <div id="collapse-${user.id}"
               class="collapse"
               aria-labelledby="heading-${user.id}"
               data-bs-parent="#usersAccordion">
            <div class="card-body">
              <ul class="list-group task-list">
                ${tasksHtml}
              </ul>
            </div>
          </div>
        </div>
      `;
      $acc.append(cardHtml);
    });

    cardLoaded = true;
  })
  .fail(() => showToastModal({ message:'Erreur chargement cartes', type:'error' }));
}

// ─────────────────────────────────────────────────────────────────  
// Handlers communs pour les boutons dans #cardView  

$('#cardView')
  .on('click', '.btn-view', function() {
    const id = $(this).data('id');
    $.getJSON(`/api/tasks/${id}`)
      .done(d => {
        $('#viewTaskTitle').text(d.title);
        $('#viewTaskAssignee').text(d.assigneeName || 'Non assigné');
        $('#viewTaskDeadline').text(d.deadline || '-');
        $('#viewTaskUrgency').text(d.urgency);
        $('#viewTaskStatus').text(d.status);
        $('#viewTaskDesc').text(d.description || 'Aucune description.');
        $('#viewTaskModal').modal('show');
      })
      .fail(() => showToastModal({ message:'Impossible de charger la tâche.', type:'error' }));
  })
  .on('click', '.btn-edit', function() {
    const id = $(this).data('id');
    $.getJSON(`/api/tasks/${id}`)
      .done(d => {
        // Préremplissage du formulaire d’édition
        $('#taskId').val(d.id);
        $('#taskTitle').val(d.title);
        $('#taskAssignee').val(d.assigneeId);
        $('#taskDeadline').val(d.deadline);
        $('#taskUrgency').val(d.urgency);
        $('#taskStatus').val(d.status);
        $('#taskDesc').val(d.description);
        $('#taskModal').modal('show');
      })
      .fail(() => showToastModal({ message:'Erreur chargement tâche.', type:'error' }));
  })
  .on('click', '.btn-delete', function() {
    const id = $(this).data('id');
    if (!confirm('Confirmer la suppression de cette tâche ?')) return;
    $.ajax({ url: `/api/tasks/${id}`, method: 'DELETE' })
      .done(() => {
        showToastModal({ message:'Tâche supprimée', type:'success' });
        loadCardView();
        $('#task-table').DataTable().ajax.reload();
      })
      .fail(() => showToastModal({ message:'Erreur suppression.', type:'error' }));
  })
  .on('click', '.btn-validate', function() {
    const id = $(this).data('id');
    if (!confirm('Valider cette tâche ?')) return;
    $.post(`/api/tasks/${id}/validate`)
      .done(() => {
        showToastModal({ message:'Tâche validée', type:'success' });
        loadCardView();
        $('#task-table').DataTable().ajax.reload();
      })
      .fail(() => showToastModal({ message:'Erreur validation.', type:'error' }));
  })
  .on('click', '.btn-reject', function() {
    const id = $(this).data('id');
    if (!confirm('Rejeter cette tâche ?')) return;
    $.post(`/api/tasks/${id}/reject`)
      .done(() => {
        showToastModal({ message:'Tâche rejetée', type:'success' });
        loadCardView();
        $('#task-table').DataTable().ajax.reload();
      })
      .fail(() => showToastModal({ message:'Erreur rejet.', type:'error' }));
  });

});