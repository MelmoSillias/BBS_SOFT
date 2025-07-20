// public/assets/appjs/users.js

$(document).ready(function () {
  let table;

  initTable();
  initFilters();
  initAddUserForm();
  initToggleActivation();
  initDeleteUser();
  initEditPermissions();

  function initTable() {
    table = $('#usersTable').DataTable({
      ajax: {
        url: '/api/users',
        data: () => ({
          search: $('#searchUser').val(),
          role:   $('#filterRole').val(),
          actif:  $('#filterEtat').val()
        }),
        dataSrc: 'data'
      },
      columns: [
        { data: 'id' },
        { data: 'nom_utilisateur' },
        { data: 'nom_complet' },
        {
          data: 'roles',
          render: roles => `
            <div class="dropdown">
              <button class="btn btn-sm btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                Rôles (${roles.length})
              </button>
              <ul class="dropdown-menu">
                ${roles.map(r => `<li><span class="dropdown-item">${r.replace('ROLE_', '')}</span></li>`).join('')}
              </ul>
            </div>`
        },
        {
          data: 'actif',
          render: actif =>
            actif
              ? '<span class="badge bg-success">Actif</span>'
              : '<span class="badge bg-danger">Inactif</span>'
        },
        {
  data: 'id',
  orderable: false,
  render: id => {
    const isRoot = id === 1;
    // Si id = 1, on désactive les boutons
    const disabledAttr = isRoot ? ' disabled' : '';
    return `
      <button
        class="btn btn-sm btn-secondary toggle-activation"
        data-id="${id}"
        ${disabledAttr}
      >
        <i class="bi bi-power"></i>
      </button>
      <button
        class="btn btn-sm btn-danger delete-user"
        data-id="${id}"
        ${disabledAttr}
      >
        <i class="bi bi-trash"></i>
      </button>
      <button
        class="btn btn-sm btn-secondary btn-edit-permissions"
        data-id="${id}"
        title="Modifier droits"
        ${disabledAttr}
      >
        <i class="bi bi-shield-lock-fill"></i>
      </button>`;
  }
}

      ],
      language: { url: '/api/datatable_json_fr' }
    });
    $('#usersTable').addClass('table-striped border-top border-bottom my-4');
  }

  function initFilters() {
    $('#filterRole, #filterEtat').off('change').on('change', () => table.ajax.reload());
    $('#searchUser').off('input').on('input', function () {
      table.search(this.value).draw();
    });
  }

  function initAddUserForm() {
    $('#formAddUser').off('submit').on('submit', function (e) {
      e.preventDefault();
      const $btn = $(this).find('button[type="submit"]');
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const payload = {
        nom_utilisateur: $('#username').val(),
        nom_complet:     $('#fullname').val(),
        password:        $('#password').val(),
        roles:           [$('#roles').val()],
        actif:           $('#etat').is(':checked'),
        job:             $('#jobTitle').val()
      };

      $.ajax({
        url: '/api/users',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload)
      })
      .done(() => {
        $('#modalAddUser').modal('hide');
        this.reset();
        showToastModal({ message: 'Utilisateur ajouté', type: 'success' });
        table.ajax.reload();
      })
      .fail(err => {
        showToastModal({ message: err.responseJSON?.error || 'Erreur serveur', type: 'error' });
      })
      .always(() => $btn.prop('disabled', false));
    });
  }

  function initToggleActivation() {
    $(document).off('click', '.toggle-activation').on('click', '.toggle-activation', function () {
      const $btn = $(this);
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const userId = $btn.data('id');
      $.post(`/api/users/${userId}/toggle`)
        .done(() => {
          showToastModal({ message: 'État du compte mis à jour', type: 'success' });
          table.ajax.reload();
        })
        .fail(() => showToastModal({ message: 'Erreur de mise à jour', type: 'error' }))
        .always(() => $btn.prop('disabled', false));
    });
  }

  function initDeleteUser() {
    $(document).off('click', '.delete-user').on('click', '.delete-user', function () {
      const userId = $(this).data('id');
      $('#deleteUserId').val(userId);
      $('#modalDeleteUser').modal('show');
    });

    $('#confirmDeleteUser').off('click').on('click', function () {
      const $btn = $(this);
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const userId = $('#deleteUserId').val();
      $.ajax({
        url: `/api/users/${userId}`,
        method: 'DELETE'
      })
      .done(() => {
        $('#modalDeleteUser').modal('hide');
        showToastModal({ message: 'Utilisateur supprimé', type: 'success' });
        table.ajax.reload();
      })
      .fail(() => showToastModal({ message: 'Erreur lors de la suppression', type: 'error' }))
      .always(() => $btn.prop('disabled', false));
    });
  }

  function initEditPermissions() {
    $(document).off('click', '.btn-edit-permissions').on('click', '.btn-edit-permissions', function() {
      const $btn = $(this);
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const userId = $btn.data('id');
      $('#permUserId').val(userId);

      $.ajax({
        url: `/api/users/${userId}/permissions`,
        method: 'GET'
      })
      .done(json => {
        $('#permissionsForm input[name="permissions[]"]').prop('checked', false);
        (json.permissions || []).forEach(perm => {
          $(`#permissionsForm input[value="${perm}"]`).prop('checked', true);
        });
        $('#permissionsModal').modal('show');
      })
      .fail(() => showToastModal({ message: 'Erreur récupération permissions', type: 'error' }))
      .always(() => $btn.prop('disabled', false));
    });

    $('#permissionsForm').off('submit').on('submit', function(e) {
      e.preventDefault();
      const $btn = $(this).find('button[type="submit"]');
      if ($btn.prop('disabled')) return;
      $btn.prop('disabled', true);

      const userId = $('#permUserId').val();
      const perms  = $(this).find('input[name="permissions[]"]:checked')
                          .map((_, cb) => cb.value).get();

      $.ajax({
        url: `/api/users/${userId}/permissions`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ permissions: perms })
      })
      .done(() => {
        $('#permissionsModal').modal('hide');
        showToastModal({ message: 'Permissions mises à jour', type: 'success' });
        table.ajax.reload();
      })
      .fail(() => showToastModal({ message: 'Erreur mise à jour droits', type: 'error' }))
      .always(() => $btn.prop('disabled', false));
    });
  }
});
