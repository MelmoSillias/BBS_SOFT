function initTransfertsForm(clientId) {
    // Handlers for Add Transfer Modal
    $('#btnAddTransfert, #btnAddTransfertFloat').on('click', () => $('#modalAddTransfert').modal('show'));

    $('#dateOps').val(new Date().toISOString().split('T')[0]);

    $('#destination').change(function () {
        const destination = $(this).find(':selected').val();
        $.get(`/api/agence/${destination}`, function (data, status) {
            const abg = data['abg'];
            $('#deviseRecueDisplay').text(countryCodeCurrency[abg].currency);
            $('#nomDeviseReceptionTaux').html(
                `${countryCodeCurrency[abg].currencyName} <span class="text-danger">*</span>`
            );
            $('#tauxReception').val(countryCodeCurrency[abg].USDValue);
            calculerMontants();
        });
    });

    $("#resetForm").on('click', () => {
        $('#totalAPayer').text('0.00 CFA');
    });

    // Event handler for opening edit modal (assumes a button with data attributes)
    $('body').on('click', '.btn-edit-transfert', function () {
        const transferId = $(this).data('transfert-id');
        $.get(`/api/transfert/${transferId}`, function (data, status) {
            populateEditModal(data);
            $('#modalEditTransfert').modal('show');
        });
    });
    
    function calculerMontants() {
        const montantCash = parseFloat($('#montantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#fraisEnvoi').val()) || 0;
        const taux = parseFloat($('#taux').val()) || 1;
        const tauxReception = parseFloat($('#tauxReception').val()) || 1;

        let montantRecu = 0;
        if (montantCash > 0 && taux > 0) {
            montantRecu = montantCash / taux;
        }

        let montantReception = 0;
        if (taux > 0) {
            montantReception = montantRecu * tauxReception;
        }

        const totalAPayer = montantCash + fraisEnvoi;

        $('#montantRecu').val(montantRecu.toFixed(2));
        $('#montantDeviseReception').val(montantReception.toFixed(2));
        $('#totalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
    }

    $('#montantCash, #fraisEnvoi, #taux, #tauxReception').on('input', calculerMontants);

    // Submit handler for add form
    $('#btnAddClientTransfert').on('click', function (e) {
        e.preventDefault();

        const $form = $('#form-add-transfer');
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn);

        const formData = {
            date: $('#dateOps').val(),
            type: $('#typeOpsT').val(),
            destination: $('#destination').val(),
            expediteur: clientId,
            nomBeneficiaire: $('#nomBeneficiaire').val(),
            phoneBeneficiaire: $('#phoneBeneficiaire').val(),
            montantCash: $('#montantCash').val(),
            fraisEnvoi: $('#fraisEnvoi').val(),
            taux: $('#taux').val(),
            montantUSD: $('#montantRecu').val(),
            tauxReception: $('#tauxReception').val(),
            montantDeviseReception: $('#montantDeviseReception').val(),
            totalAPayer: $('#totalAPayer').text(),
            moneyReceived: $('#moneyReceived').prop('checked')
        };

        $.ajax({
            url: '/api/transfert/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                $('#modalAddTransfert').modal('hide')
                showToastModal({ message: 'Transfert créé avec succès', type: 'success' });
                $('#form-add-transfer').trigger("reset");
                $('#select-expediteur').val(null).trigger('change');
                $('#new-client-section').addClass('d-none');
                ('#transfersTable').ajax.reload(); 
                $('#opsFilterDateRange').ajax.reload();
                calculerMontants();
                const transferId = response.transfertId;
                setTimeout(() => { window.open('/api/transferts/' + transferId + '/receipt', '_blank'); }, 2000);
            },
            error: function (xhr, status, error) {
                showToastModal({ message: error || "Erreur de connexion", type: 'error' });
            },
            complete: function () {
                enableButton($btn);
            }
        });
    });

    calculerMontants();
}