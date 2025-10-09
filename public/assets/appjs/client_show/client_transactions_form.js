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

        $('#modalAccompteClients').modal('show');
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
                exchangesTable.ajax.reload();
                transactionsTable.ajax.reload();
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
                exchangesTable.ajax.reload();
                transactionsTable.ajax.reload();
                loadStats();
                setTimeout(() => { window.open(`/api/transaction/${response.id}/receipt`, '_blank'); }, 2000)
            })
            .fail(xhr => {
                const msg = xhr.responseJSON?.message || 'Erreur enregistrement retrait';
                showToastModal({ message: msg, type: 'error' });
            })
            .always(() => $btn.prop('disabled', false));
    });

    // Fonction pour mettre à jour l'interface en fonction de l'agence sélectionnée
    function updateUIByAgency() {
        const selectedAgencyId = parseInt($destination.val());

        if (selectedAgencyId === 1) {
            // Agence d'id 1: tous les choix sont disponibles
            $typeOps.prop('disabled', false).prop('readonly', false);
            $deviseExchange.prop('disabled', false).prop('readonly', false);
        } else {
            // Autres agences: seulement vente et USD
            $typeOps.val('vente').prop('disabled', true).prop('readonly', true);
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
            $devise.text('CFA');
        } else {
            $devise.text(selectedDevise);
        }
    }

    // Fonction pour calculer le total
    function calculateTotal() {
        const montant = parseFloat($montant.val()) || 0;
        const taux = parseFloat($taux.val()) || 0;
        const type = $typeOps.val();
        const devise = $deviseExchange.val();

        let total = 0;

        if (type === 'achat') {
            // Pour l'achat: montant en devise * taux = montant en CFA
            total = montant * taux;
            $totalAPayer.removeClass('text-success text-danger').addClass('text-danger');
            $totalAPayer.text(`-${total.toFixed(2)} CFA`);
        } else {
            // Pour la vente: montant en devise * taux = montant en CFA
            total = montant * taux;
            $totalAPayer.removeClass('text-success text-danger').addClass('text-success');
            $totalAPayer.text(`+${total.toFixed(2)} CFA`);
        }
    }

    // Événement lors du changement d'agence
    $destination.on('change', function () {
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

    // Événement pour le bouton d'échange
    $exchangeButton.on('click', function () {
        // Validation des champs
        if (!$montant.val() || !$taux.val()) {
            showToastModal({ message: 'Veuillez remplir tous les champs obligatoires.', type: "warning" });
            return;
        }

        // Récupération des données du formulaire
        const formData = {
            clientId: extractClientId(),
            destination: $destination.find(":selected").val(),
            type: $typeOps.val(),
            deviseExchange: $deviseExchange.val(),
            montant: $montant.val(),
            date: $("#dateOpsEchange").val(),
            taux: $taux.val(),
            note: $('#exchangeNote').val()
        };

        $.post(`/api/client/${formData.clientId}/exchange`, formData)
            .done(function (response, textStatus, jqXHR) {
                showToastModal({ message: `${formData.type} effectué avec succès !`, type: 'success' });
                table.ajax.reload();
                loadStats();
                setTimeout(() => { window.open('/api/exchanges/' + response.id + '/print', '_blank') }, 2000)
            }).fail(() => {
                showToastModal({ message: "L'opération a echouée !", type: 'error' })
            })

        // Fermer le modal après traitement
        $('#currencyModal').modal('hide');
    });

    // Initialisation de l'interface au chargement
    updateUIByAgency();
    calculateTotal();
}