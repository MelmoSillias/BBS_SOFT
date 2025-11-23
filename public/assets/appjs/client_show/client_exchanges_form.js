$(document).ready(
    () => { 
        const clientId = extractClientId();

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
                    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#exchangesTable')) {
                        const _ex = $('#exchangesTable').DataTable();
                        if (_ex.ajax && typeof _ex.ajax.reload === 'function') _ex.ajax.reload();
                    }
                    setTimeout(() => { window.open('/api/exchanges/' + response.id + '/print', '_blank') }, 2000)
                }).fail(() => {
                    showToastModal({ message: "L'opération a echouée !", type: 'error' })
                })

            // Fermer le modal après traitement
            $('#currencyModal').modal('hide');
        });


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
                    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#exchangesTable')) {
                        const _ex = $('#exchangesTable').DataTable();
                        if (_ex.ajax && typeof _ex.ajax.reload === 'function') _ex.ajax.reload();
                    }
                    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#opsTable')) {
                        const _dt = $('#opsTable').DataTable();
                        if (_dt.ajax && typeof _dt.ajax.reload === 'function') _dt.ajax.reload();
                    }
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
                $editTotalAPayer.removeClass('text-success text-danger').addClass('text-danger');
                $editTotalAPayer.text(`-${total.toFixed(2)} CFA`);
            } else {
                total = montant * taux;
                $editTotalAPayer.removeClass('text-success text-danger').addClass('text-success');
                $editTotalAPayer.text(`+${total.toFixed(2)} CFA`);
            }
        }

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

        $editExchangeButton.on('click', function () {
            // Validation des champs
            if (!$editMontant.val() || !$editTaux.val()) {
                showToastModal({ message: 'Veuillez remplir tous les champs obligatoires.', type: "warning" });
                return;
            }

            const selectedExchange = $('#editCurrencyModal').data('id')
            // Récupération des données du formulaire
            const formData = {
                clientId: extractClientId(),
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
                url: `/api/client/${clientId}/exchange/${selectedExchange}/update`,
                method: 'PUT',
                data: JSON.stringify(formData),
                contentType: 'application/json',
                success: function (response) {
                    $('#editCurrencyModal').modal('hide');
                    showToastModal({ message: `${formData.type} modifié avec succès !`, type: 'success' });
                    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#opsTable')) {
                        const _dt = $('#opsTable').DataTable();
                        if (_dt.ajax && typeof _dt.ajax.reload === 'function') _dt.ajax.reload();
                    }
                    if ($.fn.DataTable && $.fn.DataTable.isDataTable('#exchangesTable')) {
                        const _ex = $('#exchangesTable').DataTable();
                        if (_ex.ajax && typeof _ex.ajax.reload === 'function') _ex.ajax.reload();
                    }
                },
                error: function (xhr, status, error) {
                    $('#editCurrencyModal').modal('hide');
                    showToastModal({ message: "La modification a échoué !", type: 'error' });
                    $('#editCurrencyModal').modal('show');
                }
            });
        });

        

    }




)