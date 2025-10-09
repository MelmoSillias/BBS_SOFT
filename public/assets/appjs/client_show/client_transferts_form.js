function initTransfertsForm(clientId) {
    $('#btnAddTransfert , #btnAddTransfertFloat').on('click', () => $('#modalAddTransfert').modal('show'));

    $('#dateOps').val(new Date().toISOString().split('T')[0]);
 
    $('#destination').change(function () {
        const destination = $(this).find(':selected').val();
        let abg
        $.get(`/api/agence/${destination}`,
            function (data, status) {
                abg = data['abg'] 
                $('#deviseRecueDisplay').text(countryCodeCurrency[abg].currency);
                $('#nomDeviseReceptionTaux').html(
                    `
                        ${countryCodeCurrency[abg].currencyName}
                                    <span class="text-danger">*</span>
                        `
                );
                $('#tauxReception').val(countryCodeCurrency[abg].USDValue)

                calculerMontants();
            });
    });

    $("#resetForm").on('click', () => {
        $('#totalAPayer').text(0 + ' CFA');
    });
    
    function calculerMontants() {
        const montantCash = parseFloat($('#montantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#fraisEnvoi').val()) || 0;
        const taux = parseFloat($('#taux').val()) || 1;
        const destination = $('[name="destination"]').val();
        const tauxReception = $('#tauxReception').val();
        
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
    
    $('#montantCash, #fraisEnvoi, #taux').on('input', calculerMontants);


    $('#form-add-transfer').submit(function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn) 

        const type = $('[name="type"]').val();

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
            totalAPayer: $('#totalAPayer').text()
        };

        // Envoi des données via AJAX
        $.ajax({
            url: '/api/transfert/create', // Remplacez par l'URL de votre endpoint
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Transfert crée avec succès', type: 'success' });
                // Réinitialisation du formulaire
                $('#form-add-transfer').trigger("reset");
                $('#select-expediteur').val(null).trigger('change');
                $('#new-client-section').addClass('d-none');
                tableTransfers.ajax.reload()
                calculerMontants();

                transferId = response.transfertId;
                setTimeout(() => { window.open('/api/transferts/' + transferId + '/receipt', '_blank') }, 2000)
            },
            error: function (xhr, status, error) {
                showToastModal({ message: !error && error != "" ? error : "Erreur de connexion", type: 'error' })
            }
        });
    });

    
    calculerMontants();
}


