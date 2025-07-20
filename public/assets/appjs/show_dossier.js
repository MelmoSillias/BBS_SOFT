$(function() {
  const dossierId = $('#dossier-data').data('id');

  // Action buttons
  $('#btnEdit').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;
    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}`,
      method: 'GET',
      success: function(data) {
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
      },
      error: function() {
        showToastModal({ message: 'Impossible de charger les données', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#confirmEditBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const payload = {
      reference: $('#editReference').val(),
      senderName: $('#editSenderName').val(),
      senderContact: $('#editSenderContact').val(),
      dateReception: $('#editDateReception').val(),
      modeTransmission: $('#editModeTransmission').val(),
      urgency: $('#editUrgency').val(),
      sender: $('#editSender').val(),
      primaryRecipient: $('#editPrimaryRecipient').val(),
      owner: $('#editOwner').val(),
      generalObservations: $('#editGeneralObservations').val()
    };

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}`,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function() {
        $('#editModal').modal('hide');
        showToastModal({ message: 'Données mises à jour', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur mise à jour', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnAssign').on('click', function() {
    $('#assignDossierId, #assignOwner').val('');
    $('#assignModal').modal('show');
  });

  $('#confirmAssignBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const owner = $('#assignOwner').val();
    if (!owner) return;

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/assign`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ owner }),
      success: function() {
        $('#assignModal').modal('hide');
        showToastModal({ message: 'Dossier affecté', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur affectation', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnReassign').on('click', function() {
    $('#reassignDossierId, #reassignOwner').val('');
    $('#reassignModal').modal('show');
  });

  $('#confirmReassignBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const owner = $('#reassignOwner').val();
    if (!owner) return;

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/reassign`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ owner }),
      success: function() {
        $('#reassignModal').modal('hide');
        showToastModal({ message: 'Dossier réaffecté', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur réaffectation', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnChangeUrgency').on('click', function() {
    $('#newUrgency').val('');
    $('#urgencyModal').modal('show');
  });

  $('#confirmUrgencyBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const urgency = $('#newUrgency').val();
    if (!urgency) return;

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/change-urgency`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ urgency }),
      success: function() {
        $('#urgencyModal').modal('hide');
        showToastModal({ message: 'Urgence mise à jour', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur mise à jour urgence', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnTransfer').on('click', function() {
    $('#transferDossierId')[0].value = dossierId;
    $('#formTransferModal')[0].reset();
    $('#transferModal').modal('show');
  });

  $('#confirmTransferBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const payload = {
      date: $('#transferDate').val(),
      destination: $('#transferDestination').val(),
      motif: $('#transferMotif').val(),
      transferResponsible: $('#transferResponsible').val()
    };

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/transfer`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function() {
        $('#transferModal').modal('hide');
        showToastModal({ message: 'Transfert effectué', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur transfert', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnArchive').on('click', function() {
    $('#formArchiveModal')[0].reset();
    $('#archiveModal').modal('show');
  });

  $('#confirmArchiveBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    const payload = {
      dateArchiving: $('#archiveDate').val(),
      bureauDepos: $('#archiveBureau').val(),
      archivist: $('#archiveArchivist').val(),
      cote: $('#archiveCote').val(),
      archivingNotes: $('#archiveNotes').val()
    };

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/archive`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function() {
        $('#archiveModal').modal('hide');
        showToastModal({ message: 'Archivage effectué', type: 'success' }); 
      },
      error: function() {
        showToastModal({ message: 'Erreur archivage', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnValidate').on('click', function() {
    $('#confirmValidationModal').modal('show');
  });

  $('#confirmValidationBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/validate`,
      method: 'POST',
      success: function() {
        $('#confirmValidateModal').modal('hide');
        showToastModal({ message: 'Dossier validé', type: 'success' });
        window.location.reload();
      },
      error: function() {
        showToastModal({ message: 'Erreur validation', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnValidate2').on('click', function() {
    $('#confirmValidationModal').modal('show');
  });

  $('#confirmValidationBtn').off('click').on('click', function() {
    const $btn = $(this);
    if ($btn.prop('disabled')) return;

    $btn.prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/validate`,
      method: 'POST',
      success: function() {
        $('#confirmValidateModal').modal('hide');
        showToastModal({ message: 'Dossier validé', type: 'success' }); 
        window.location.reload();
      },
      error: function() {
        showToastModal({ message: 'Erreur validation', type: 'error' });
      },
      complete: function() {
        $btn.prop('disabled', false);
      }
    });
  });

  $('#btnExportPdf').on('click', function() {
    window.open(`/api/dossiers/${dossierId}/export/pdf`, '_blank');
  });

  $('#btnExportExcel').on('click', function() {
    window.open(`/api/dossiers/${dossierId}/export/xlsx`, '_blank');
  });

  $("#processingForm").on('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const $form = $("#processingForm");
    $form.find(':input').prop('disabled', true);

    $.ajax({
      url: `/api/dossiers/${dossierId}/processing`,
      method: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(response) {
        showToastModal({ message: 'Enregistrement réussi', type: 'success' });
      },
      error: function(xhr) {
        showToastModal({ message: 'Erreur lors de l\'enregistrement', type: 'danger' });
      },
      complete: function() {
        $form.find(':input').prop('disabled', false);
      }
    });
  });

  // Initialize Bootstrap tooltips if any
  $('[data-bs-toggle="tooltip"]').each(function() {
    new bootstrap.Tooltip(this);
  });
});
