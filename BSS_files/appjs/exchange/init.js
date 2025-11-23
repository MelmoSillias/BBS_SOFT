let agences = []; // Liste des agences
let currentExchangeId = null; // ID de l'échange en cours de traitement
let exchangesTable

const $agence = $('#agence');
const $typeOps = $('#typeOps');
const $deviseExchange = $('#deviseExchange');
const $montant = $('#montant');
const $taux = $('#taux');
const $deviseAgenceDisplay = $('#deviseAgenceDisplay');
const $devise = $('#devise');
const $totalAPayer = $('#totalAPayer');
const $form = $('#form-add-exchange');
const $dateOps = $('#dateOps');

const $agenceDirectMod = $('#agence-mod-direct');
const $typeOpsDirectMod = $('#typeOps-mod-direct');
const $deviseExchangeDirectMod = $('#deviseExchange-mod-direct');
const $montantDirectMod = $('#montant-mod-direct');
const $tauxDirectMod = $('#taux-mod-direct');
const $deviseAgenceDisplayDirectMod = $('#deviseAgenceDisplay-mod-direct');
const $deviseDirectMod = $('#devise-mod-direct');
const $totalAPayerDirectMod = $('#totalAPayer-mod-direct');
const $formDirectMod = $('#form-add-exchange-mod-direct');
const $dateOpsDirectMod = $('#dateOps-mod-direct');
const $descriptionDirectMod = $('#description-mod-direct');
const $editExchangeDirectButton = $('#editExchangeButton');

const $editDestination = $('#editDestinationEchange');
const $editTypeOps = $('#editTypeOpsEchange');
const $editDeviseExchange = $('#editDeviseExchange');
const $editMontant = $('#editMontantEchange');
const $editTaux = $('#editTauxEchange');
const $editDeviseAgenceDisplay = $('#editDeviseAgenceDisplayEchange');
const $editDevise = $('#editDeviseEchange');
const $editTotalAPayer = $('#editTotalAPayerEchange');
const $editExchangeButton = $('#editExchangeButton');

// Mise à jour des statistiques
function updateStats() {
    $.ajax({
        url: '/api/exchanges/stats',
        method: 'GET',
        dataType: 'json',
        success: function (stats) {
            $('#stat-total').text(stats.total);
            $('#stat-valide').text(stats.completed);
            $('#stat-attente').text(stats.pending);
            $('#stat-annule').text(stats.cancelled);
            $('#stat-achat').text(stats.achat);
            $('#stat-vente').text(stats.vente);
            $('#stat-montant-achat').text(formatMoney(stats.montant_achat) + ' FCFA');
            $('#stat-montant-vente').text(formatMoney(stats.montant_vente) + ' FCFA');
            $('#stat-localsolde').text(formatMoney(stats.local_solde) + ' FCFA');
            $('#stat-taux-moyen').text(stats.taux_moyen);
        },
        error: function () {
            showToastModal({
                message: 'Erreur lors du chargement des statistiques',
                type: 'error'
            });
        }
    });
}
