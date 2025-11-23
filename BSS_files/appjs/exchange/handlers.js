// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Filtres
    $('#filterStatus, #filterType, #filterAgence').change(loadExchanges);
    $('#refreshTable').click(loadExchanges);

    // Formulaire d'échange 

    // Actions sur les échanges
    $(document).on('click', '.edit-exchange', showEditExchangeModal);
    $(document).on('click', '.print-exchange', printReceipt);
    $(document).on('click', '.cancel-exchange', confirmDeleteExchange);

    $('#confirmDelete').click(deleteExchange);

    // Impression
    $('#printReceiptBtn').click(printReceipt);
}

// Affichage du modal de visualisation d'échange
function showExchangeModal() {
    const exchangeId = $(this).data('id');
    currentExchangeId = exchangeId;

    const tr = $(this).closest('tr');
    const row = $('#exchangesTable').DataTable().row(tr).data();


    populateExchangeModal(row);
    $('#viewExchangeModal').modal('show');
}

function showEditExchangeModal() {
    const exchangeId = $(this).data('id');
    const client = $(this).data('client');
    currentExchangeId = exchangeId;

    if (client && client !== undefined) {
        populateModExchangeClientModal(exchangeId, client)
    } else {
        populateModExchangeDirectModal(exchangeId)
    }
}

function confirmDeleteExchange() {
    currentExchangeId = $(this).data('id');
    $('#modalDeleteExchange').modal('show');
}

// Suppression d'échange
function deleteExchange() {
    $('#modalDeleteExchange').modal('hide');

    // En production, envoyer la requête au serveur
    $.ajax({
        url: '/api/exchanges/' + currentExchangeId,
        type: 'DELETE',
        success: function () {
            showToastModal({
                message: 'Échange supprimé avec succès',
                type: 'success'
            });
            loadExchanges();
        },
        error: function (error) {
            showToastModal({
                message: error.responseJSON?.message || 'Erreur lors de la suppression',
                type: 'error'
            });
        }
    });


}

// Impression de reçu
function printReceipt() {
    currentExchangeId = $(this).data('id');

    if (!currentExchangeId) {
        showToastModal({
            message: 'Aucun échange sélectionné pour l\'impression',
            type: 'error'
        });
        return;
    }

    // Ouvrir une nouvelle fenêtre pour l'impression
    const printWindow = window.open('/api/exchanges/' + currentExchangeId + '/print', '_blank');
    printWindow.focus();
}


// Événement lors du changement d'agence
$agence.on('change', function () {
    updateUIByAgency();
    calculateTotal();
});

// Événement lors du changement de type d'opération
$typeOps.on('change', function () {
    updateDeviseDisplay();
    calculateTotal();
});

// Événement lors du changement de devise
$deviseExchange.on('change', function () {
    updateDeviseDisplay();
    calculateTotal();
});

// Événements pour le calcul en temps réel
$montant.on('input', calculateTotal);
$taux.on('input', calculateTotal);


// Événement pour la réinitialisation du formulaire
$('#resetForm').on('click', function () {
    // Réinitialiser la date à aujourd'hui
    $dateOps.val(today);

    // Laisser un petit délai pour que la réinitialisation s'applique
    setTimeout(function () {
        updateUIByAgency();
        calculateTotal();
    }, 100);
});

$agenceDirectMod.on('change', function () {
    updateUIByAgencyDirectMod();
    calculateTotalDirectMod();
});

// Événement lors du changement de type d'opération
$typeOpsDirectMod.on('change', function () {
    updateDeviseDisplayDirectMod();
    calculateTotalDirectMod();
});

// Événement lors du changement de devise
$deviseExchangeDirectMod.on('change', function () {
    updateDeviseDisplayDirectMod();
    calculateTotalDirectMod();
});

// Événements pour le calcul en temps réel
$montantDirectMod.on('input', calculateTotalDirectMod);
$tauxDirectMod.on('input', calculateTotalDirectMod);

$editDestination.on('change', function () {
    updateEditUIByAgency();
    calculateEditTotal();
});

$editTypeOps.on('change', function () {
    updateEditDeviseDisplay();
    calculateEditTotal();
});

$editDeviseExchange.on('change', function () {
    updateEditDeviseDisplay();
    calculateEditTotal();
});

$editMontant.on('input', calculateEditTotal);
$editTaux.on('input', calculateEditTotal);

// Événement pour la soumission du formulaire
$form.on('submit', function (e) {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!$agence.val()) {
        showToastModal({ message: 'Veuillez sélectionner une agence.', type: 'error' });
        return;
    }

    if (!$montant.val() || parseFloat($montant.val()) <= 0) {
        showToastModal({ message: 'Veuillez saisir un montant valide.', type: 'error' });
        return;
    }

    if (!$taux.val() || parseFloat($taux.val()) <= 0) {
        showToastModal({ message: 'Veuillez saisir un taux valide.', type: 'error' });
        return;
    }
    // Récupération des données du formulaire
    const formData = {
        agence: $agence.val(),
        description: $('#description').val(),
        date: $dateOps.val(),
        type: $typeOps.val(),
        deviseExchange: $deviseExchange.val(),
        montant: $montant.val(),
        taux: $taux.val(),
    };

    // Envoi des données au serveur
    $.ajax({
        url: '/api/exchanges', // URL à adapter selon votre API
        method: 'POST',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function (response) {
            showToastModal({ message: 'Échange créé avec succès!', type: 'success' });

            // Réinitialiser le formulaire
            $form[0].reset();
            $dateOps.val(new Date());

            // Mettre à jour l'interface
            updateUIByAgency();
            calculateTotal();

            // Recharger la table des échanges si elle existe
            if (typeof exchangesTable !== 'undefined' && exchangesTable) {
                exchangesTable.ajax.reload();
            }

            setTimeout(() => { window.open('/api/exchanges/' + response.id + '/print', '_blank') }, 2000)
        },
        error: function (xhr) {
            showToastModal({ message: 'Erreur lors de la création de l\'échange: ', type: "error" });
        }
    });
});

$('#saveModExchangeDirectBtn').on('click', function (e) {
    e.preventDefault();

    const id = $(this).data('id')
    // Validation des champs obligatoires
    if (!$agenceDirectMod.val()) {
        showToastModal({ message: 'Veuillez sélectionner une agence.', type: 'error' });
        return;
    }

    if (!$montantDirectMod.val() || parseFloat($montantDirectMod.val()) <= 0) {
        showToastModal({ message: 'Veuillez saisir un montant valide.', type: 'error' });
        return;
    }

    if (!$tauxDirectMod.val() || parseFloat($tauxDirectMod.val()) <= 0) {
        showToastModal({ message: 'Veuillez saisir un taux valide.', type: 'error' });
        return;
    }
    // Récupération des données du formulaire
    const formData = {
        agence: $agenceDirectMod.val(),
        description: $('#description-mod-direct').val(),
        date: $dateOpsDirectMod.val(),
        type: $typeOpsDirectMod.val(),
        deviseExchange: $deviseExchangeDirectMod.val(),
        montant: $montantDirectMod.val(),
        taux: $tauxDirectMod.val(),
    };

    // Envoi des données au serveur
    $.ajax({
        url: `/api/exchanges/${id}`, // URL à adapter selon votre API
        method: 'PUT',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function (response) {
            showToastModal({ message: 'Échange modifié avec succès!', type: 'success' });
  
            // Recharger la table des échanges si elle existe
            if (typeof exchangesTable !== 'undefined' && exchangesTable) {
                exchangesTable.ajax.reload();
            }
 
        },
        error: function (xhr) {
            showToastModal({ message: 'Erreur lors de la modification de l\'échange: ', type: "error" });
        }
    });
});

$editExchangeButton.on('click', function () {
    // Validation des champs
    if (!$editMontant.val() || !$editTaux.val()) {
        showToastModal({ message: 'Veuillez remplir tous les champs obligatoires.', type: "warning" });
        return;
    }

    const selectedExchange = $('#modifyExchangeModalClient').data('id')
    const client = $('#modifyExchangeModalClient').data('client')
    // Récupération des données du formulaire
    const formData = {
        clientId: client,
        destination: $editDestination.find(":selected").val(),
        type: $editTypeOps.val(),
        deviseExchange: $editDeviseExchange.val(),
        montant: $editMontant.val(),
        date: $("#editDateOpsEchange").val(),
        taux: $editTaux.val(),
        note: $('#editExchangeNote').val(),
        ref: $('#editExchangeRef').val()// Supposons que la référence est au format "EX-12345"
    };
    // Envoi des données via AJAX
    $.ajax({
        url: `/api/client/${client}/exchange/${selectedExchange}/update`,
        method: 'PUT',
        data: JSON.stringify(formData),
        contentType: 'application/json',
        success: function (response) {
            $('#modifyExchangeModalClient').modal('hide');
            showToastModal({ message: `${formData.type} modifié avec succès !`, type: 'success' }); 
            $('#exchangesTable').DataTable().ajax.reload();
        },
        error: function (xhr, status, error) {
            $('#modifyExchangeModalClient').modal('hide');
            showToastModal({ message: "La modification a échoué !", type: 'error' });
            $('#modifyExchangeModalClient').modal('show');
        }
    });
});
