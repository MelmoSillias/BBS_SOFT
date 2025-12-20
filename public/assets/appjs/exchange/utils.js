// Remplissage du modal d'échange
function populateExchangeModal(exchange) {
    // Informations générales
    $('#exchangeDate').text(formatDate(exchange.date));
    $('#exchangeType').html(exchange.type === 'achat' ?
        '<span class="badge bg-info">Achat</span>' :
        '<span class="badge bg-warning text-dark">Vente</span>');
    $('#exchangeDescription').text(exchange.description || 'N/A');

    // Détails financiers
    $('#exchangeDevise').text(exchange.montantDevise + ' ' + exchange.devise);

    $('#exchangeRate').text((isFinite(exchange.taux) || !isNaN(parseFloat(exchange.taux))) ? parseFloat(exchange.taux).toFixed(6) + ' FCFA' : exchange.taux + ' FCFA');

    const montantCfaRounded = roundCFA(exchange.montantCFA);
    $('#exchangeAmount').text((exchange.type === 'achat' ? '-' : '+') + formatCFA(montantCfaRounded) + ' ' + "CFA");
    if (exchange.type === 'achat') {
        $('#exchangeAmount').removeClass('text-success').addClass('text-danger');
    } else {
        $('#exchangeAmount').removeClass('text-danger').addClass('text-success');
    }

    // Gestion des boutons d'action
    $('#validateExchangeBtn, #cancelExchangeBtn, #deleteExchangeBtn').addClass('d-none');
    $('#cancelExchangeBtn').removeClass('d-none');

    // Configuration des gestionnaires d'événements
    $('#cancelExchangeBtn').off('click').click(function () {
        $('#viewExchangeModal').modal('hide');
        confirmCancelExchange.call({ dataset: { id: exchange.id } });
    });
}

function populateModExchangeDirectModal(exchangeId) {
    // Informations générales
    $.ajax({
        url: `/api/exchanges/${exchangeId}`,
        type: 'GET',
        success: function (response) {
            if (!response.success) {
                alert("Erreur : " + response.message);
                return;
            }

            let data = response.data;

            $agenceDirectMod.val(data.destination);
            $typeOpsDirectMod.val(data.type);
            $deviseExchangeDirectMod.val(data.devise);
            $montantDirectMod.val(data.montantDevise);
            $tauxDirectMod.val(data.taux);
            $descriptionDirectMod.text(data.description)
            $deviseAgenceDisplayDirectMod.val(data.devise);
            $deviseDirectMod.val(data.devise);
            const roundedCFA = roundCFA(data.montantCFA);
            $totalAPayerDirectMod.val(roundedCFA);
            $dateOpsDirectMod.val(data.date);

            updateDeviseDisplayDirectMod()  
            calculateTotalDirectMod() 

            $('#modifyExchangeModalDirect').modal('show')
            $('#saveModExchangeDirectBtn').data('id', exchangeId)
            
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Impossible de récupérer les informations de l'échange.");
        }
    });
}

function populateModExchangeClientModal(exchangeId, clientId) {
    // Appel à l'API Symfony pour récupérer les données complètes
    $.ajax({
        url: `/api/client/${clientId}/exchange/${exchangeId}`,
        type: 'GET',
        success: function (response) {
            if (!response.success) {
                alert("Erreur : " + response.message);
                return;
            }

            let data = response.data;

            // Remplir le modal Edit avec les données récupérées
            $('#editExchangeRef').val(data.ref || "EX-" + data.id.toString().padStart(5, '0'));
            $('#editDateOpsEchange').val(data.date.split(' ')[0]); // format YYYY-MM-DD
            $('#editDestinationEchange').val(data.agence ? data.agence.id : '');
            $('#editTypeOpsEchange').val(data.type);
            $('#editDeviseExchange').val(data.devise);
            $('#editMontantEchange').val(data.montant_devise);
            $('#editDeviseEchange').text(data.devise);
            $('#editTauxEchange').val((isFinite(data.taux) || !isNaN(parseFloat(data.taux))) ? parseFloat(data.taux).toFixed(6) : data.taux);
            $('#editExchangeNote').val(data.description || '');

            // Calculer et afficher le total
            let total = parseFloat(data.montant_devise) * parseFloat(data.taux);
            $('#editTotalAPayerEchange').text(total.toFixed(2) + " CFA");

            updateEditUIByAgency();
            calculateEditTotal();

            // Afficher le modal
            $('#modifyExchangeModalClient').modal('show');
            $('#modifyExchangeModalClient').data('id', data.id)
            $('#modifyExchangeModalClient').data('client', clientId)
        },
        error: function (xhr) {
            console.error(xhr.responseText);
            alert("Impossible de récupérer les informations de l'échange.");
        }
    });
}

// Fonction pour mettre à jour l'interface en fonction de l'agence sélectionnée
function updateUIByAgency() {
    const selectedAgencyId = parseInt($agence.val());

    if (selectedAgencyId === 1) {
        // Agence d'id 1: tous les choix sont disponibles
        $typeOps.prop('disabled', false).prop('readonly', false);
        $deviseExchange.prop('disabled', false).prop('readonly', false);
    } else {
        // Autres agences: seulement achat et USD
        $typeOps.val('achat').prop('disabled', true).prop('readonly', true);
        $deviseExchange.val('USD').prop('disabled', true).prop('readonly', true);
    }

    // Mettre à jour l'affichage des devises
    updateDeviseDisplay();
} 
// Fonction pour mettre à jour l'affichage des devises
function updateDeviseDisplay() {
    const selectedDevise = $deviseExchange.val();
    $deviseAgenceDisplay.text(selectedDevise);

    if ($typeOps.val() === 'achat') {
        $devise.text(selectedDevise);
    } else {
        $devise.text(selectedDevise);
    }
}

// Fonction pour calculer le total
function calculateTotal() {
    const montant = parseFloat($montant.val()) || 0;
    const taux = parseFloat($taux.val()) || 0;
    const type = $typeOps.val();

    let total = 0;

    if (type === 'achat') {
        // Pour l'achat: montant en devise * taux = montant en CFA (négatif)
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $totalAPayer.removeClass('text-success text-danger').addClass('text-danger');
        $totalAPayer.text(`-${formatCFA(totalRounded)} CFA`);
    } else {
        // Pour la vente: montant en devise * taux = montant en CFA (positif)
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $totalAPayer.removeClass('text-success text-danger').addClass('text-success');
        $totalAPayer.text(`+${formatCFA(totalRounded)} CFA`);
    }
}

// Fonction pour mettre à jour l'interface en fonction de l'agence sélectionnée
function updateUIByAgencyDirectMod() {
    const selectedAgencyId = parseInt($agenceDirectMod.val());

    if (selectedAgencyId === 1) {
        // Agence d'id 1: tous les choix sont disponibles
        $typeOpsDirectMod.prop('disabled', false).prop('readonly', false);
        $deviseExchangeDirectMod.prop('disabled', false).prop('readonly', false);
    } else {
        // Autres agences: seulement achat et USD
        $typeOpsDirectMod.val('achat').prop('disabled', true).prop('readonly', true);
        $deviseExchangeDirectMod.val('USD').prop('disabled', true).prop('readonly', true);
    }

    // Mettre à jour l'affichage des devises
    updateDeviseDisplayDirectMod();
}

function updateDeviseDisplayDirectMod() {
    const selectedDevise = $deviseExchangeDirectMod.val();
    $deviseAgenceDisplayDirectMod.text(selectedDevise);

    if ($typeOpsDirectMod.val() === 'achat') {
        $deviseDirectMod.text(selectedDevise);
    } else {
        $deviseDirectMod.text(selectedDevise);
    }
}

function calculateTotalDirectMod() {
    const montant = parseFloat($montantDirectMod.val()) || 0;
    const taux = parseFloat($tauxDirectMod.val()) || 0;
    const type = $typeOpsDirectMod.val();

    let total = 0;

    if (type === 'achat') {
        // Pour l'achat: montant en devise * taux = montant en CFA (négatif)
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $totalAPayerDirectMod.removeClass('text-success text-danger').addClass('text-danger');
        $totalAPayerDirectMod.text(`-${formatCFA(totalRounded)} CFA`);
        $totalAPayerDirectMod.val(totalRounded);
    } else {
        // Pour la vente: montant en devise * taux = montant en CFA (positif)
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $totalAPayerDirectMod.removeClass('text-success text-danger').addClass('text-success');
        $totalAPayerDirectMod.text(`+${formatCFA(totalRounded)} CFA`);
        $totalAPayerDirectMod.val(totalRounded);
    }
}

function updateEditUIByAgency() {
    const selectedAgencyId = parseInt($editDestination.val());
    if (selectedAgencyId === 1) {
        // Agence d'id 1: tous les choix sont disponibles
        $editTypeOps.prop('disabled', false).prop('readonly', false);
        $editDeviseExchange.prop('disabled', false).prop('readonly', false);
    } else {
        // Autres agences: seulement vente et USD
        $editTypeOps.val('vente').prop('disabled', true).prop('readonly', true);
        $editDeviseExchange.val('USD').prop('disabled', true).prop('readonly', true);
    }
    // Mettre à jour l'affichage des devises
    updateEditDeviseDisplay();
}

function updateEditDeviseDisplay() {
    const selectedDevise = $editDeviseExchange.val();
    $editDeviseAgenceDisplay.text(selectedDevise);
    if ($editTypeOps.val() === 'achat') {
        $editDevise.text('CFA');
    } else {
        $editDevise.text(selectedDevise);
    }
}

// Fonction pour mettre à jour l'interface du modal Edit en fonction de l'agence sélectionnée
function updateEditUIByAgency() {
    const selectedAgencyId = parseInt($editDestination.val());
    if (selectedAgencyId === 1) {
        // Agence d'id 1: tous les choix sont disponibles
        $editTypeOps.prop('disabled', false).prop('readonly', false);
        $editDeviseExchange.prop('disabled', false).prop('readonly', false);
    } else {
        // Autres agences: seulement vente et USD
        $editTypeOps.val('vente').prop('disabled', true).prop('readonly', true);
        $editDeviseExchange.val('USD').prop('disabled', true).prop('readonly', true);
    }
    // Mettre à jour l'affichage des devises
    updateEditDeviseDisplay();
}


function calculateEditTotal() {
    const montant = parseFloat($editMontant.val()) || 0;
    const taux = parseFloat($editTaux.val()) || 0;
    const type = $editTypeOps.val();
    let total = 0;
    if (type === 'achat') {
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $editTotalAPayer.removeClass('text-success text-danger').addClass('text-danger');
        $editTotalAPayer.text(`-${formatCFA(totalRounded)} CFA`);
    } else {
        total = montant * taux;
        const totalRounded = roundCFA(total);
        $editTotalAPayer.removeClass('text-success text-danger').addClass('text-success');
        $editTotalAPayer.text(`+${formatCFA(totalRounded)} CFA`);
    }
}

// Helper: Formatage de date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// Helper: Formatage d'argent
function formatMoney(amount) {
    return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
}

// Arrondir le CFA à l'entier le plus proche par pas de 50
function roundCFA(amount) {
    const value = parseFloat(amount) || 0;
    return Math.round(value / 50) * 50;
}

function formatCFA(amount) {
    return (parseFloat(amount) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}