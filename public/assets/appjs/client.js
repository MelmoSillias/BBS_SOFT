// assets/clients/js/clients.js
$(document).ready(function() {
  // ─────────────────────────────────────────────────────────────────
  // 1. DataTable initialisation
  const table = $('#clientsTable').DataTable({
    ajax: {
      url: '/api/clients',
      dataSrc: 'data'
    },
    dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Liste des clients',
        exportOptions: { columns: [0,1,2,3] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Liste des clients',
        exportOptions: { columns: [0,1,2,3] },
        customize: function(doc) {
          doc.content[1].table.widths = ['*','*','*','*'];
          doc.content[1].table.body[0].forEach(cell => {
            cell.fillColor = '#007bff';
            cell.color     = '#ffffff';
          });
        }
      }
    ],
    columns: [
      { data: 'type' },
      { data: 'companyName' },
      { data: 'phoneNumber' },
      { data: 'balance', render: d => parseFloat(d).toLocaleString() },
      { data: 'id', orderable: false, render: renderActions }
    ],
    language: { url: '/api/datatable_json_fr' },
    order: [[0,'asc']],
    rowGroup: {
      dataSrc: 'type',
      startRender: (rows, group) => {
        return $('<tr/>')
          .append(`<td colspan="5" class="bg-secondary text-white">
                    Liste des clients ${group.charAt(0).toUpperCase()+group.slice(1)}
                  </td>`);
      }
    }
  });

  // Render action buttons
  function renderActions(id) {
    return `
      <button class="btn btn-sm btn-info modify"    data-id="${id}" title="Modifier">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button class="btn btn-sm btn-danger deactivate" data-id="${id}" title="Désactiver">
        <i class="bi bi-x-circle"></i>
      </button>
      <a href="/dashboard/client/${id}/details" class="btn btn-sm btn-secondary details" data-id="${id}">
        <i class="bi bi-info-circle"></i>
      </a>
      <button class="btn btn-sm btn-success accompte"  data-id="${id}" title="Accompte">
        <i class="bi bi-wallet2"></i>
      </button>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // 2. Load stats
  function loadStats() {
    $.get('/api/clients/stats', stats => {
      $('#stats').html(`
        <div class="col-lg-4">
          <div class="small-box bg-primary">
            <div class="inner"><h3>${stats.total}</h3><p>Clients au total</p></div>
            <div class="icon"><i class="bi bi-people-fill"></i></div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="small-box bg-success">
            <div class="inner"><h3>${stats.gesta}</h3><p>Clients Gesta</p></div>
            <div class="icon"><i class="bi bi-building"></i></div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="small-box bg-warning">
            <div class="inner"><h3>${stats.intern}</h3><p>Clients Intern</p></div>
            <div class="icon"><i class="bi bi-briefcase-fill"></i></div>
          </div>
        </div>
      `);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 3. Add Client — prevent double submit
  $('#form-ajout-client').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.post('/api/client/add', $form.serialize())
      .done(() => {
        showToastModal({ message:'Client ajouté avec succès!', type:'success' });
        $form[0].reset();
        loadStats();
        table.ajax.reload();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur ajout client';
        showToastModal({ message: msg, type:'error' });
      })
      .always(() => {
        $btn.prop('disabled', false);
      });
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Details modal — disable btn while loading
  $('#clientsTable tbody').on('click', '.details', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    $('#modalActionContent').load(`/client/${id}/details`, () => {
      $('#modalAction').modal('show');
      $btn.prop('disabled', false);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Edit Client — load and submit
  $('#clientsTable tbody').on('click', '.modify', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $btn.data('id');
    $.get(`/api/client/${id}/smalldetails`)
      .done(details => {
        $('#editClientId')        .val(details.id);
        $('#editCompanyName')     .val(details.companyName);
        $('#editDelagate')        .val(details.delegate||'');
        $('#editPhoneNumber')     .val(details.phoneNumber);
        $('#editAddress')         .val(details.address||'');
        $('#editTypeClient')      .val(details.type);
        toggleCommitteeField(details.type);
        if (details.type==='gesta') {
          $('#editCommittee').val(details.committee||'');
        }
        $('#modalEditClient').modal('show');
      })
      .fail(() => showToastModal({ message:'Erreur chargement client', type:'error' }))
      .always(() => $btn.prop('disabled', false));
  });

  $('#form-edit-client').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $('#editClientId').val();
    const fd = new FormData(this);

    $.ajax({
      url: `/client/${id}/modify`,
      method: 'POST',
      data: fd,
      processData: false,
      contentType: false
    })
    .done(() => {
      showToastModal({ message:'Client modifié avec succès !', type:'success' });
      $('#modalEditClient').modal('hide');
      table.ajax.reload();
    })
    .fail(xhr => {
      const msg = xhr.responseJSON?.message || 'Erreur modification client';
      showToastModal({ message: msg, type:'error' });
    })
    .always(() => $btn.prop('disabled', false));
  });

  function toggleCommitteeField(type) {
    $('#editComitediv').toggleClass('d-none', type!=='gesta');
  }

  $('#editTypeClient').on('change', function(){
    toggleCommitteeField($(this).val());
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Accompte modal + submit
  $('#clientsTable tbody').on('click', '.accompte', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const data = table.row($btn.closest('tr')).data();
    $('#accompteClientId').val(data.id);
    $('#accompteAmount, #accompteNote, #accompteMode, #accompteReference')
      .val('');
    $('#accompteDate').val(new Date().toISOString().slice(0,10));
    $('#modalAccompteClient').modal('show');
    $btn.prop('disabled', false);
  });

  $('#form-accompte-client').on('submit', function(e) {
    e.preventDefault();
    const $form = $(this);
    const $btn  = $form.find('button[type="submit"]');
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    const id = $('#accompteClientId').val();
    const payload = {
      amount:    $('#accompteAmount').val(),
      note:      $('#accompteNote').val(),
      date:      $('#accompteDate').val(),
      mode:      $('#accompteMode').val(),
      reference: $('#accompteReference').val()
    };

    $.post(`/dashboard/client/${id}/accompte`, payload)
      .done(() => {
        showToastModal({ message:'Accompte enregistré !', type:'success' });
        $('#modalAccompteClient').modal('hide');
        table.ajax.reload();
        loadStats();
      })
      .fail(xhr => {
        const msg = xhr.responseJSON?.message || 'Erreur enregistrement acompte';
        showToastModal({ message: msg, type:'error' });
      })
      .always(() => $btn.prop('disabled', false));
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Deactivate client
  let deleteId = null;
  $('#clientsTable tbody').on('click', '.deactivate', function(e) {
    e.preventDefault();
    deleteId = $(this).data('id');
    $('#modalConfirmDelete').modal('show');
  });

  $('#modalConfirmDelete').on('click', '#confirmDeleteBtn', function(e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.post(`/api/client/${deleteId}/deactivate`)
      .done(() => {
        showToastModal({ message:'Client désactivé', type:'warning' });
        $('#modalConfirmDelete').modal('hide');
        table.ajax.reload();
        loadStats();
      })
      .fail(() => showToastModal({ message:'Erreur désactivation', type:'error' }))
      .always(() => $btn.prop('disabled', false));
  });

  // ─────────────────────────────────────────────────────────────────
  // Initial load
  loadStats();
});
