// assets/dashboard/js/dashboard.js

$(function() {
  // ─── DOM elements ──────────────────────────────────────────────
  const $filterDate    = $('#filterTasksDate');
  const $filterStatus  = $('#filterTasksStatus');
  const $tasksList     = $('#tasksList');
  const $foldersList   = $('#foldersList');
  const $invoicesList  = $('#invoicesList');
  const $tasksTotal    = $('#tasksTotal');
  const $tasksOpen     = $('#tasksOpen');
  const $tasksDonePct  = $('#tasksDonePct');
  const $btnRefresh    = $('#btnRefreshDash');
  const $viewTaskModal = $('#viewTaskModal');
  const $confirmCompleteTaskModal = $('#confirmCompleteTaskModal');
  const $confirmCompleteTaskBtn   = $('#confirmCompleteTaskBtn');

  // ─── Initialize filters & events ────────────────────────────────
  // Status filter default
  $filterStatus.val('open');

  // Date range picker
  $filterDate.daterangepicker({
    locale: { format: 'YYYY-MM-DD' },
    autoUpdateInput: false,
    opens: 'left'
  })
  .on('apply.daterangepicker', (ev, picker) => {
    $filterDate.val(
      picker.startDate.format('YYYY-MM-DD') +
      ' - ' +
      picker.endDate.format('YYYY-MM-DD')
    );
    loadDashboardTasks();
  })
  .on('cancel.daterangepicker', () => {
    $filterDate.val('');
    loadDashboardTasks();
  });

  // On status change
  $filterStatus.on('change', loadDashboardTasks);

  // Manual refresh button
  $btnRefresh.on('click', () => {
    loadDashboardTasks();
    loadDashboardFolders();
    loadDashboardInvoices();
  });

  // Auto-refresh every minute
  setInterval(() => {
    loadDashboardTasks();
    loadDashboardFolders();
    loadDashboardInvoices();
  }, 60000);

  // Initial load
  loadDashboardTasks();
  loadDashboardFolders();
  loadDashboardInvoices();


  // ─── Load functions ──────────────────────────────────────────────

  function loadDashboardTasks() {
    let url = '/api/dashboard/tasks';
    const params = [];
    const dr = $filterDate.val();
    const st = $filterStatus.val();
    if (dr) params.push(`dateRange=${encodeURIComponent(dr)}`);
    if (st) params.push(`status=${encodeURIComponent(st)}`);
    if (params.length) url += `?${params.join('&')}`;

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => {
        const tasks = json.tasks || json;
        const total = tasks.length;
        const openCount = tasks.filter(t => t.status === 'open' || t.status === 'rejected').length;
        const validatedCount = tasks.filter(t => t.status === 'validated').length;
        const donePct = total ? Math.round((validatedCount / total) * 100) : 0;

        $tasksTotal.text(total);
        $tasksOpen.text(openCount);
        $tasksDonePct.text(donePct + '%');

        $tasksList.empty();
        if (!total) {
          $tasksList.append(
            '<li class="list-group-item text-center text-muted">Aucune tâche à afficher</li>'
          );
        } else {
    tasks.forEach(t => {
        // Determine the badge class and text based on the task status
        let badgeClass, badgeText;
        if (t.status === 'open') {
            badgeClass = 'badge bg-secondary';
            badgeText = 'en cours';
        } else if (t.status === 'validated') {
            badgeClass = 'badge bg-success';
            badgeText = 'validée';
        } else if (t.status === 'rejected') {
            badgeClass = 'badge bg-danger';
            badgeText = 'rejetée';
        } else if (t.status === 'waiting_validation') {
            badgeClass = 'badge bg-info';
            badgeText = 'en attente de validation';
        } else {
            badgeClass = 'badge bg-primary';
            badgeText = t.status;
        }

        const $li = $(`
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${t.title}</span>
                <div>
                    <span class="${badgeClass}">${badgeText}</span>
                    <div class="btn-group"></div>
                </div>
            </li>
        `);

        const $btns = $li.find('.btn-group');

        // View button
        $btns.append(`
            <button class="btn btn-sm btn-light btn-view-task" data-id="${t.id}" title="Voir">
                <i class="bi bi-eye"></i>
            </button>
        `);

        // Complete if open or rejected
        if (t.status === 'open' || t.status === 'rejected') {
            $btns.append(`
                <button class="btn btn-sm btn-success btn-complete-task" data-id="${t.id}" title="Terminer">
                    <i class="bi bi-check2-circle"></i>
                </button>
            `);
        }

        $tasksList.append($li);
    });
        }
      })
      .catch(err => console.error('Error loading tasks', err));
  }

  function loadDashboardFolders() {
    fetch('/api/dashboard/folders')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => {
        const folders = json.folders || json;
        $foldersList.empty();
        if (!folders.length) {
          $foldersList.append(
            '<li class="list-group-item text-center text-muted">Aucun dossier assigné</li>'
          );
        } else {
          folders.forEach(f => {
            const badgeClass = {
              received:      'info',
              in_processing: 'primary',
              validated:     'success',
              archived:      'secondary'
            }[f.status] || 'light';

            const $li = $(`
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <a href="/dashboard/dossiers/${f.id}" class="fw-bold">${f.companyName}</a>
                  <small class="text-muted d-block">${f.observations}</small>
                  <small class="text-muted">${f.dateReception}</small>
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-${badgeClass} text-capitalize">${f.status}</span>
                  <button class="btn btn-sm btn-outline-primary btn-treat-folder" data-id="${f.id}">
                    <i class="bi bi-pencil-square"></i> Traiter
                  </button>
                </div>
              </li>
            `);
            $foldersList.append($li);
          });
        }
      })
      .catch(err => console.error('Error loading folders', err));
  }

  function loadDashboardInvoices() {
    fetch('/api/dashboard/invoices')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(json => {
        const invs = json.invoices || json;
        $invoicesList.empty();
        if (!invs.length) {
          $invoicesList.append(
            '<li class="list-group-item text-center text-muted">Aucune facture récente</li>'
          );
        } else {
          invs.forEach(inv => {
            const $li = $(`
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>${inv.number}</strong> – ${inv.clientName} – ${inv.amount}€
                  <small class="text-muted d-block">${inv.updatedAt}</small>
                </div>
                <a href="/invoices/${inv.id}" class="btn btn-sm btn-light">
                  <i class="bi bi-eye"></i>
                </a>
              </li>
            `);
            $invoicesList.append($li);
          });
        }
      })
      .catch(err => console.error('Error loading invoices', err));
  }


  // ─── Event handlers ─────────────────────────────────────────────

  // View task details
  $tasksList.on('click', '.btn-view-task', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);
    const id = $btn.data('id');
    fetch(`/api/tasks/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => {
        $('#viewTaskTitle').text(d.title);
        $('#viewTaskAssignee').text(d.assigneeName || 'Non assigné');
        $('#viewTaskDeadline').text(d.deadline || '-');
        $('#viewTaskUrgency').text(d.urgency);

        // Set badge based on status
        const $statusBadge = $('#viewTaskStatus');
        if (d.status === 'open') {
            $statusBadge.html('<span class="badge bg-secondary">en attente</span>');
        } else if (d.status === 'validate') {
            $statusBadge.html('<span class="badge bg-success">validée</span>');
        } else if (d.status === 'rejected') {
            $statusBadge.html('<span class="badge bg-danger">rejetée</span>');
        } else {
            $statusBadge.text(d.status);
        }

        $('#viewTaskDesc').text(d.description || 'Aucune description.');
        $viewTaskModal.modal('show');
      })
      .catch(() => showToastModal({ message: 'Erreur chargement tâche', type: 'error' }))
      .finally(() => $btn.prop('disabled', false));
});


  // Complete task: open confirmation modal
  $tasksList.on('click', '.btn-complete-task', function() {
    const id = $(this).data('id');
    $confirmCompleteTaskModal.data('id', id).modal('show');
  });

  // Confirm complete
  $confirmCompleteTaskBtn.on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $confirmCompleteTaskModal.data('id');
    fetch(`/api/tasks/${id}/complete`, { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(() => {
        $confirmCompleteTaskModal.modal('hide');
        loadDashboardTasks();
      })
      .catch(() => showToastModal({ message: 'Erreur fermeture tâche', type: 'error' }))
      .finally(() => $btn.prop('disabled', false));
  });

  // Treat folder
  $foldersList.on('click', '.btn-treat-folder', function() {
    const id = $(this).data('id');
    window.location.href = `/dashboard/dossiers/${id}`;
  }); 

  $('#changePasswordForm').on('submit', function(e) {
  e.preventDefault();

  const payload = {
    oldPassword:     $('#oldPassword').val().trim(),
    newPassword:     $('#newPassword').val().trim(),
    confirmPassword: $('#confirmPassword').val().trim()
  };

  // Vérification cliente rapide
  if (!payload.oldPassword || !payload.newPassword || !payload.confirmPassword) {
    return showToastModal({ message: 'Tous les champs sont requis.', type: 'error' });
  }
  if (payload.newPassword !== payload.confirmPassword) {
    return showToastModal({ message: 'La confirmation ne correspond pas.', type: 'error' });
  }
  if (payload.newPassword.length < 8) {
    return showToastModal({ message: 'Le mot de passe doit contenir au moins 8 caractères.', type: 'error' });
  }
  if (payload.newPassword === payload.oldPassword){
    return showToastModal({ message: 'Le nouveau mot de passe doit être différent de l\'ancien.', type: 'error' });
  }

  // Envoi au serveur 
  $.ajax({
    url: '/dashboard/users/change-password',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(payload),
  })
  .done(response => {
    // response = { success: bool, message: string }
    showToastModal({
      message: response.message,
      type: response.success ? 'success' : 'error'
    });
    if (response.success) {
      // Optionnel : fermer le modal ou réinitialiser le formulaire
      $('#changePasswordModal').modal('hide');
      $('#changePasswordForm')[0].reset();
    }
  })
  .fail((jqXHR, textStatus) => {
    // Si le serveur renvoie du JSON, on l’affiche, sinon un message générique
    let msg = 'Une erreur est survenue.';
    if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
      msg = jqXHR.responseJSON.message;
    }
    showToastModal({ message: msg, type: 'error' });
  });
});



});
 