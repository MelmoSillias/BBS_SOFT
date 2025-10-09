// assets/dashboard/js/dashboard.js

$(function () {



  $('#changePasswordForm').on('submit', function (e) {
    e.preventDefault();

    const payload = {
      oldPassword: $('#oldPassword').val().trim(),
      newPassword: $('#newPassword').val().trim(),
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
    if (payload.newPassword === payload.oldPassword) {
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
