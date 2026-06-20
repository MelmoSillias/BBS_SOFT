
const countryCodeCurrency = {
    'EAU': { code: "EAU", countryName: "Émirats Arabes Unis", capital: "Abou Dabi", currency: "AED", currencyName: "Dirham des Émirats Arabes Unis", USDValue: 3.67 },
    'FR': { code: "FR", countryName: "France", capital: "Paris", currency: "EUR", currencyName: "Euro", USDValue: 0.93 },
    'USA': { code: "USA", countryName: "États-Unis", capital: "Washington, D.C.", currency: "USD", currencyName: "Dollar américain", USDValue: 1.00 },
    'UK': { code: "UK", countryName: "Royaume-Uni", capital: "Londres", currency: "GBP", currencyName: "Livre sterling", USDValue: 0.80 },
    'CHI': { code: "CHI", countryName: "Chine", capital: "Pékin", currency: "CNY", currencyName: "Yuan chinois", USDValue: 7.24 },
    'MRC': { code: "MRC", countryName: "Maroc", capital: "Rabat", currency: "MAD", currencyName: "Dirham marocain", USDValue: 10.03 },
    'ALG': { code: "ALG", countryName: "Algérie", capital: "Alger", currency: "DZD", currencyName: "Dinar algérien", USDValue: 133.40 }
};

const $destination = $('#destinationEchange');
const $typeOps = $('#typeOpsEchange');
const $deviseExchange = $('#deviseExchange');
const $montant = $('#montantEchange');
const $taux = $('#tauxEchange');
const $deviseAgenceDisplay = $('#deviseAgenceDisplayEchange');
const $devise = $('#deviseEchange');
const $totalAPayer = $('#totalAPayerEchange');
const $exchangeButton = $('#exchangeButton');

// Modal Edit
const $editDestination = $('#editDestinationEchange');
const $editTypeOps = $('#editTypeOpsEchange');
const $editDeviseExchange = $('#editDeviseExchange');
const $editMontant = $('#editMontantEchange');
const $editTaux = $('#editTauxEchange');
const $editDeviseAgenceDisplay = $('#editDeviseAgenceDisplayEchange');
const $editDevise = $('#editDeviseEchange');
const $editTotalAPayer = $('#editTotalAPayerEchange');
const $editExchangeButton = $('#editExchangeButton');

let selectedTransactionID

/** Extrait l'ID client depuis l'URL : /client/{id}/... */
function extractClientId() {
    const parts = window.location.pathname.split('/');
    const idx = parts.indexOf('client');
    return (idx >= 0 && parts.length > idx + 1) ? parts[idx + 1] : null;
}

function fillEditTransactionModal(data) {
    $("#editTransDate").val(data.date);
    $("#editTransAmount").val(data.montant);
    $("#editTransNote").val(data.note);

    if (data.isInterClient) {
        const typeLabel = data.type === 'Retrait'
            ? 'transfert-intercompte (Retrait)'
            : 'transfert-intercompte (Versement)';
        $("#editTransType").val(typeLabel);
        $("#editTransOtherClient").val(data.otherClient ? data.otherClient.nomComplet : '');
        $("#editTransCurrency").val(data.currency || 'CFA');
        $("#editTransOtherClientGroup, #editTransCurrencyGroup").removeClass('d-none');
    } else {
        $("#editTransType").val(data.type);
        $("#editTransOtherClientGroup, #editTransCurrencyGroup").addClass('d-none');
    }
}

function showCancelTransactionModal(isInterClient) {
    if (isInterClient) {
        $("#confirmCancelInterclientHint").removeClass('d-none');
    } else {
        $("#confirmCancelInterclientHint").addClass('d-none');
    }
    $("#confirmCancelTransactionModal").modal('show');
}

function chargeCurrencySolde(idClient, currency, input) {
    $.get(`/api/client/${idClient}/stats/${currency}`, function (data) {
        $(input).text(`${data.balance} ${currency}`);
    }).fail(function () {
        showToastModal({ message: 'Erreur lors de la récupération du solde.', type: 'error' });
    });
}

// Fonction pour charger les soldes du client
function loadClientSoldes(clientId) {
    $.ajax({
        url: `/api/client/${clientId}/stats`,
        method: 'GET',
        success: function (response) {
            // Supprimer l'indicateur de chargement
            $('#clientBalances').empty();

            // Parcourir toutes les devises dans la réponse
            for (const [currencyCode, amount] of Object.entries(response)) {
                // Trouver les informations de la devise

                let currencyInfo = null;
                for (const country in countryCodeCurrency) {
                    if (countryCodeCurrency[country].currency === currencyCode) {
                        currencyInfo = countryCodeCurrency[country];
                        break;
                    }
                }

                // Si nous n'avons pas d'info, utiliser des valeurs par défaut
                if (!currencyInfo) {
                    currencyInfo = {
                        currency: currencyCode,
                        currencyName: currencyCode,
                        countryName: "Non spécifié",
                        USDValue: 1
                    };
                }

                // Calculer l'équivalent en USD
                const usdEquivalent = (amount * currencyInfo.USDValue).toFixed(2);

                // Générer le code HTML pour cette devise
                const balanceCard = currencyCode == "CFA" ? `
                            <div class="col-md-3 col-sm-6 mb-4">
                                <div class="card balance-card border-0">
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-3"> 
                                    <div>
                                        <div class="balance-currency">${currencyInfo.currencyName}</div>
                                        <div class="balance-amount text-primary">${formatCurrency(amount, currencyCode)}</div>
                                    </div>
                                    </div> 
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                    <span class="balance-trend bg-light text-dark">
                                        <i class="bi bi-arrow-up-right text-success"></i> ${currencyInfo.currency}
                                    </span> 
                                    </div>
                                </div>
                                </div>
                            </div>
                            ` : ``;

                // Ajouter la carte au conteneur
                $('#clientBalances').append(balanceCard);
            }
        },
        error: function (xhr, status, error) {
            $('#clientBalances').html(`
                        <div class="col-12 text-center py-4">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                        <p class="mt-2">Erreur lors du chargement des soldes</p>
                        <button class="btn btn-sm btn-primary mt-2" onclick="loadClientSoldes(${clientId})">Réessayer</button>
                        </div>
                    `);
        }
    });

}

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Fonction utilitaire pour formater les montants selon la devise
function formatCurrency(amount, currencyCode) {
    const formatter = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
    });

    return formatter.format(amount);
}

function formatMontant(valeur) {
    return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
}

// Arrondit un montant CFA au multiple de 50 le plus proche
function roundCFA(amount) {
    const value = parseFloat(amount) || 0;
    return Math.round(value / 50) * 50;
}

function formatCFA(amount) {
    return (parseFloat(amount) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function disableButton(button) {
    button.prop('disabled', true);
    setTimeout(() => {
        button.prop('disabled', false);
    }, 10000); // Réactiver après 3 secondes
}

function populateEditModal(id) {
    $.get('/api/transferts/' + id, function (data) {
        $('#dateOpsEdit').val(data.createdAt);
        $('#typeOpsTEdit').val(data.type);
        $('#destinationEdit').val(data.destination.id);
        $('#nomBeneficiaireEdit').val(data.receiverName);
        $('#phoneBeneficiaireEdit').val(data.receiverPhone);
        $('#montantCashEdit').val(data.montantCFA);
        $('#fraisEnvoiEdit').val(data.fraisEnvoi);
        $('#tauxEdit').val((isFinite(data.taux) || !isNaN(parseFloat(data.taux))) ? parseFloat(data.taux).toFixed(6) : data.taux);
        $('#montantRecuEdit').val(data.montantUSD);
        $('#tauxReceptionEdit').val((isFinite(data.tauxReception) || !isNaN(parseFloat(data.tauxReception))) ? parseFloat(data.tauxReception).toFixed(6) : data.tauxReception);
        $('#montantDeviseReceptionEdit').val(data.montantReception);
        $('#totalAPayerEdit').text(data.montantCash + data.frais);

        // Trigger destination change to update currency display
        $.get(`/api/agence/${data.destination.id}`, function (data, status) {
            const abg = data['abg'];
            $('#deviseRecueDisplayEdit').text(countryCodeCurrency[abg].currency);
            $('#nomDeviseReceptionTauxEdit').html(
                `${countryCodeCurrency[abg].currencyName} <span class="text-danger">*</span>`
            );
            $('#tauxReceptionEdit').val(countryCodeCurrency[abg].USDValue);
            calculerMontantsEdit();
        });
        $('#modalEditTransfert').data('id', id)
        $('#modalEditTransfert').modal('show');
    }).fail(function () {
        showToastModal({ message: 'Erreur de connexion', type: 'error' });
    });
}// Function to calculate amounts for edit modal

function calculerMontantsEdit() {
    const montantCash = parseFloat($('#montantCashEdit').val()) || 0;
    const fraisEnvoi = parseFloat($('#fraisEnvoiEdit').val()) || 0;
    const taux = parseFloat($('#tauxEdit').val()) || 1;
    const tauxReception = parseFloat($('#tauxReceptionEdit').val()) || 1;

    let montantRecu = 0;
    if (montantCash > 0 && taux > 0) {
        montantRecu = montantCash / taux;
    }

    let montantReception = 0;
    if (taux > 0) {
        montantReception = montantRecu * tauxReception;
    }

    const totalAPayer = montantCash + fraisEnvoi;

    $('#montantRecuEdit').val(montantRecu.toFixed(2));
    $('#montantDeviseReceptionEdit').val(montantReception.toFixed(2));
    $('#totalAPayerEdit').text(totalAPayer.toFixed(2) + ' CFA');
}

