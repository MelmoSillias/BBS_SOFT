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
                loadClientSoldes(extractClientId())
                ('#exchangesTab#le').ajax.reload();
                ('#transactionsTable').ajax.reload();
                $('#opsFilterDateRange').ajax.reload();
                loadStats();
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
                ('#exchangesTab#le').ajax.reload();
                ('#transactionsTable').ajax.reload();
                $('#opsFilterDateRange').ajax.reload();
                loadStats();
                setTimeout(() => { window.open(`/api/transaction/${response.id}/receipt`, '_blank'); }, 2000)
            })
            .fail(xhr => {
                const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
                showToastModal({ message: msg, type: 'error' });
            })
            .always(() => $btn.prop('disabled', false));
    });

    
 
}