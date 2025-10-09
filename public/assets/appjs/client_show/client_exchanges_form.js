$(document).ready(
    () => {
        $('#btnExchange , #btnExchangeFloat').on('click', function (e) {
            e.preventDefault();
            const $btn = $(this);
            if ($btn.prop('disabled')) return;
            $btn.prop('disabled', true);

            $('#exchangeClientId').val(extractClientId());
            $('#fromCurrency, #toCurrency').val('');
            $('#fromAmount, #toAmount').val('');
            $('#exchangeRate').text(''); // Clear the exchange rate display

            $('#currencyModal').modal('show');
            $btn.prop('disabled', false);
        });

        // Empêcher la sélection de la même devise pour le départ et l'arrivée
        $('#fromCurrency, #toCurrency').change(function () {
            const fromCurrency = $('#fromCurrency').val();
            const toCurrency = $('#toCurrency').val();

            if (fromCurrency && toCurrency && fromCurrency === toCurrency) {
                alert("Vous ne pouvez pas choisir la même devise de départ et d'arrivée.");
                $(this).val('');
            }
        });

        // Calcul automatique du montant converti et affichage du taux de change
        $('#fromAmount, #exchangeRate').on('input', function () {
            const amount = parseFloat($('#fromAmount').val());
            const rate = parseFloat($('#exchangeRate').val());

            if (!isNaN(amount) && !isNaN(rate)) {
                const convertedAmount = amount * rate;
                $('#toAmount').val(convertedAmount.toFixed(2));
            }
        });

        // Mettre à jour le taux de change affiché lorsque les devises changent
        $('#fromCurrency, #toCurrency').change(function () {
            const fromCurrency = $('#fromCurrency').val();
            const toCurrency = $('#toCurrency').val();

            if (fromCurrency && toCurrency) {
                // Vous pouvez récupérer le taux de change par défaut depuis une API ici si nécessaire
                // Pour l'instant, nous allons simplement afficher un message indiquant que le taux doit être saisi manuellement
                $('#exchangeRate').val(''); // Efface le taux actuel
                $('#toAmount').val(''); // Efface le montant converti
            }
        });

        // Récupérer et afficher le solde actuel
        $('#fromCurrency').on('change', function () {
            const currency = $(this).find(':selected').val();
            const clientId = $('#exchangeClientId').val();
            console.log(currency, clientId)
            if (currency && clientId) {
                chargeCurrencySolde(clientId, currency, '#currentBalance')
            }
        });

        // Gérer l'échange de devise
        $('#exchangeButton').click(function () {
            const fromCurrency = $('#fromCurrency').val();
            const toCurrency = $('#toCurrency').val();
            const fromAmount = $('#fromAmount').val();
            const toAmount = $('#toAmount').val();
            const clientId = $('#exchangeClientId').val();

            if (!fromCurrency || !toCurrency || !fromAmount || !toAmount) {
                showToastModal({ message: "Veuillez remplir tous les champs.", type: 'warning' });
                return;
            }

            const payload = {
                fromCurrency: fromCurrency,
                toCurrency: toCurrency,
                fromAmount: fromAmount,
                toAmount: toAmount
            };

            // Remplacez cette URL par l'endpoint de votre API pour effectuer l'échange de devise
            $.post(`/api/client/${clientId}/exchange`, payload)
                .done(() => {
                    $('#currencyModal').modal('hide');
                    showToastModal({ message: "échange de devise éffectué.", type: 'success' });
                    loadClientSoldes(extractClientId())
                    exchangesTable.ajax.reload();
                })
                .fail(() => {
                    showToastModal({ message: "Erreur lors de l'échange de devise.", type: 'error' });
                });
        });



    }
)