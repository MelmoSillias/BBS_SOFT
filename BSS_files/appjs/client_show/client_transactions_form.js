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

function initTransactionsForm(clientId) {
    $('#btnAccompte').on('click', function (e) {
        e.preventDefault();
        const $btn = $(this);
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);

        const id = extractClientId();
        $('#accompteClientId').val(id);
        $('#accompteAmount, #accompteNote, #accompteMode, #accompteReference').val('');
        $('#accompteDate').val(new Date().toISOString().slice(0, 10));
        const currency = $('#deviseA').find(':selected').val()
        chargeCurrencySolde(id, currency, '#soldeDeviseA')

        $('#modalAccompteClient').modal('show');
        $btn.prop('disabled', false);
    });

    $('#deviseA').change(function () {
        const currency = $(this).find(':selected').val();
        const clientId = $('#accompteClientId').val();

        if (currency && clientId) {
            // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
            chargeCurrencySolde(clientId, currency, '#soldeDeviseA')
        }
    });

    $('#form-accompte-client').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);
        const id = $('#accompteClientId').val();
        const payload = {
            amount: $('#accompteAmount').val(),
            note: $('#accompteNote').val(),
            date: $('#accompteDate').val(),
            mode: $('#accompteMode').val(),
            reference: $('#accompteReference').val(),
            currency: $('#deviseA').find(':selected').val()
        };
        $.post(`/dashboard/client/${id}/accompte`, payload)
            .done(function (response, textStatus, jqXHR) {
                showToastModal({ message: 'Accompte enregistré !', type: 'success' });
                $('#modalAccompteClient').modal('hide');
                
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#exchangesTable')) {
                    const _ex = $('#exchangesTable').DataTable();
                    if (_ex.ajax && typeof _ex.ajax.reload === 'function') _ex.ajax.reload();
                }
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#transactionsTable')) {
                    const _tr = $('#transactionsTable').DataTable();
                    if (_tr.ajax && typeof _tr.ajax.reload === 'function') _tr.ajax.reload();
                }
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#opsTable')) {
                    const _dt = $('#opsTable').DataTable();
                    if (_dt.ajax && typeof _dt.ajax.reload === 'function') _dt.ajax.reload();
                }
                loadClientSoldes(extractClientId());
                setTimeout(() => { window.open(`/api/transaction/${response.id}/receipt`, '_blank'); }, 2000)
            })
            .fail(xhr => {
                const msg = xhr.responseJSON?.message || 'Erreur enregistrement acompte';
                showToastModal({ message: msg, type: 'error' });
            })
            .always(() => $btn.prop('disabled', false));
    });

    $('#btnWithdraw').on('click', function (e) {
        e.preventDefault();
        const $btn = $(this);
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);

        const id = extractClientId();
        $('#withdrawClientId').val(id);
        $('#withdrawAmount, #withdrawNote, #withdrawMode, #withdrawReference').val('');
        $('#withdrawDate').val(new Date().toISOString().slice(0, 10));
        const currency = $('#deviseW').find(':selected').val()
        chargeCurrencySolde(id, currency, '#soldeDeviseW')

        $('#modalWithdrawClient').modal('show');
        $btn.prop('disabled', false);
    });

    $('#deviseW').change(function () {
        const currency = $(this).find(':selected').val();
        const clientId = $('#withdrawClientId').val();

        if (currency && clientId) {
            // Remplacez cette URL par l'endpoint de votre API pour obtenir le solde du client
            chargeCurrencySolde(clientId, currency, '#soldeDeviseW')
        }
    });

    $('#form-withdraw-client').on('submit', function (e) {
        e.preventDefault();
        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);


        const id = $('#withdrawClientId').val();
        const payload = {
            amount: $('#withdrawAmount').val(),
            note: $('#withdrawNote').val(),
            date: $('#withdrawDate').val(),
            mode: $('#withdrawMode').val(),
            reference: $('#withdrawReference').val(),
            currency: $('#deviseW').find(':selected').val()
        };
        $.post(`/dashboard/client/${id}/retrait`, payload)
            .done(function (response, textStatus, jqXHR) {
                showToastModal({ message: 'Retrait effectué !', type: 'success' });
                $('#modalWithdrawClient').modal('hide');
                loadClientSoldes(extractClientId())
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#exchangesTable')) {
                    const _ex = $('#exchangesTable').DataTable();
                    if (_ex.ajax && typeof _ex.ajax.reload === 'function') _ex.ajax.reload();
                }
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#transactionsTable')) {
                    const _tr = $('#transactionsTable').DataTable();
                    if (_tr.ajax && typeof _tr.ajax.reload === 'function') _tr.ajax.reload();
                }
                if ($.fn.DataTable && $.fn.DataTable.isDataTable('#opsTable')) {
                    const _dt = $('#opsTable').DataTable();
                    if (_dt.ajax && typeof _dt.ajax.reload === 'function') _dt.ajax.reload();
                }
                setTimeout(() => { window.open(`/api/transaction/${response.id}/receipt`, '_blank'); }, 2000)
            })
            .fail(xhr => {
                const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
                showToastModal({ message: msg, type: 'error' });
            })
            .always(() => $btn.prop('disabled', false));
    });

    
 
}