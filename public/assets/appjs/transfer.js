$(document).ready(function () {
    const countryCodeCurrency = {
    'EAU': {
        code: "EAU",
        countryName: "Émirats Arabes Unis",
        capital: "Abou Dabi",
        currency: "AED",
        currencyName: "Dirham des Émirats Arabes Unis",
        USDValue: 3.67
    },
    'FR': {
        code: "FR",
        countryName: "France",
        capital: "Paris",
        currency: "EUR",
        currencyName: "Euro",
        USDValue: 0.93
    },
    'USA': {
        code: "USA",
        countryName: "États-Unis",
        capital: "Washington, D.C.",
        currency: "USD",
        currencyName: "Dollar américain",
        USDValue: 1.00
    },
    'UK': {
        code: "UK",
        countryName: "Royaume-Uni",
        capital: "Londres",
        currency: "GBP",
        currencyName: "Livre sterling",
        USDValue: 0.80
    },
    'CHI': {
        code: "CHI",
        countryName: "Chine",
        capital: "Pékin",
        currency: "CNY",
        currencyName: "Yuan chinois",
        USDValue: 7.24
    },
    'MRC': {
        code: "MRC",
        countryName: "Maroc",
        capital: "Rabat",
        currency: "MAD",
        currencyName: "Dirham marocain",
        USDValue: 10.03
    },
    'ALG': {
        code: "ALG",
        countryName: "Algérie",
        capital: "Alger",
        currency: "DZD",
        currencyName: "Dinar algérien",
        USDValue: 133.40
    }
}; 
    let isNewClient
    const apiUrl = '/api/clients';

    let clients = [];

    $.get(apiUrl, function (data) {

        if (data && data.data) {

            clients = data.data.map(item => ({
                id: item.id,
                text: `${item.nomComplet} (Tél: ${item.phoneNumber}, Solde: ${item.balance})`,
                phone: item.phoneNumber,
                balance: item.balance
            }));

        } else {
            alert('Aucun client trouvé.');
        }
    }).fail(function () {
        console.log('Erreur lors de la récupération des données.');
    });

    // Initialiser la date avec la date du jour
    $('#dateOps').val(new Date().toISOString().split('T')[0]);

    $('#typeOps').on("change", () => {
        let typeOps = $('#typeOps').find(':selected').val()

        if (typeOps == "standard") {
            // recuperer le choix du client est optionnel et le client éphémère est possible
            $('#select-expediteur').find('option[value="vanish"]').prop('disabled', false)
        } else {
            // client éphémère impossible
            $('#select-expediteur').find('option[value="vanish"]').prop('disabled', true)
        }
    });


    // Initialiser Select2 pour le sélecteur d'expéditeur
    $('#select-expediteur').select2({
        placeholder: "Rechercher un client...",
        allowClear: true,
        width: '100%',
    });

    // Mettre à jour le téléphone quand un expéditeur est sélectionné
    $('#select-expediteur').on('change', function () {
        console.log($('#typeOps').find(':selected').val())
        if ($(this).val() == "vanish") {
            $('#new-client-section').removeClass('d-none')
            $('#expediteur-phone').html(``);
        } else {
            const selectedId = $(this).val();
            if (selectedId) {
                const client = clients.find(c => c.id == selectedId);
                $('#expediteur-phone').html(`
                        <div class="p-2 bg-light rounded">
                            <small class="text-muted">Téléphone :</small>
                            <div class="fw-bold">${client.phone}</div>
                            <small class="text-muted">Solde :</small>
                            <div class="fw-bold">${client.balance + "F CFA"}</div>
                        </div>
                    `);
            } else {
                $('#expediteur-phone').html(`
                        <div class="p-2 bg-light rounded">
                            <small class="text-muted">Téléphone :</small>
                            <div class="fw-bold">-</div>
                            <small class="text-muted">Solde :</small>
                            <div class="fw-bold">-</div>
                        </div>
                    `);
            } $('#new-client-section').addClass('d-none');
        }
    });

    // Gestion du changement de destination
    $('#destination').change(function () {
        const destination = $(this).find(':selected').val();

        // Mettre à jour les affichages de devise
        $('#deviseRecueDisplay').text(countryCodeCurrency[destination].currency);
        $('#nomDeviseReceptionTaux').html(
            `
                ${countryCodeCurrency[destination].currencyName}
                              <span class="text-danger">*</span>
                `
        );
        $('#tauxReception').val(countryCodeCurrency[destination].USDValue)

        // Recalculer les montants
        calculerMontants();
    });

    $("#resetForm").on('click', () => {
        $('#totalAPayer').text(0 + ' CFA');
    });

    // Calcul des montants
    function calculerMontants() {
        const montantCash = parseFloat($('#montantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#fraisEnvoi').val()) || 0;
        const taux = parseFloat($('#taux').val()) || 1;
        const destination = $('[name="destination"]').val();
        const tauxReception = $('#tauxReception').val();

        // Calcul du montant reçu
        let montantRecu = 0;
        if (montantCash > 0 && taux > 0) {
            montantRecu = montantCash / taux;
        }

        // Calcul du montant en Dirhams si destination est Dubaï
        let montantReception = 0;
        if (destination === 'EAU' && taux > 0) {
            montantReception = montantRecu * tauxReception;
        }

        // Calcul du total à payer
        const totalAPayer = montantCash + fraisEnvoi;

        // Mise à jour des champs
        $('#montantRecu').val(montantRecu.toFixed(2));
        $('#montantDeviseReception').val(montantReception.toFixed(2));
        $('#totalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
    }

    // Écouteurs pour le recalcul automatique
    $('#montantCash, #fraisEnvoi, #taux').on('input', calculerMontants);

    // Soumission du formulaire
    $('#form-add-transfer').submit(function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        if ($btn.prop('disabled')) return;
        $btn.prop('disabled', true);

        // Validation
        const type = $('[name="type"]').val();
        const expediteurId = $('#select-expediteur').find(':selected').val();
        const isNewClient = expediteurId === 'vanish'; // Vérifie si l'option "Client éphémère" est sélectionnée

        if (type === 'byAccount' && !expediteurId) {
            alert("Pour un retrait sur compte, vous devez sélectionner un client existant.");
            return;
        }

        if (isNewClient) {
            const nom = $('[name="newExpediteurNom"]').val();
            const phone = $('[name="newExpediteurPhone"]').val();
            if (!nom || !phone) {
                alert("Veuillez remplir tous les champs pour le client éphémère");
                return;
            }
        }

        // Préparation des données
        const formData = {
            date: $('#dateOps').val(),
            type: $('#typeOps').val(),
            destination: $('#destination').val(),
            expediteur: expediteurId,
            // Inclure les données du client éphémère uniquement si un nouveau client est sélectionné
            ...(isNewClient && {
                newExpediteurNom: $('[name="newExpediteurNom"]').val(),
                newExpediteurPhone: $('[name="newExpediteurPhone"]').val()
            }),
            nomBeneficiaire: $('#nomBeneficiaire').val(),
            phoneBeneficiaire: $('#phoneBeneficiaire').val(),
            montantCash: $('#montantCash').val(),
            fraisEnvoi: $('#fraisEnvoi').val(),
            taux: $('#taux').val(),
            montantRecu: $('#montantRecu').val(),
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
                calculerMontants();
            },
            error: function (xhr, status, error) {
                showToastModal({ message: 'Erreur création transfert', type: 'error' })
            }
        });
    });


    calculerMontants();

    // Initialisation des filtres date range
		$(document).ready(function() {
			$('#filterDateRange').daterangepicker({
				locale: {
					format: 'DD/MM/YYYY',
					applyLabel: 'Appliquer',
					cancelLabel: 'Annuler',
					daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
					monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
					firstDay: 1
				},
				opens: 'right',
				autoUpdateInput: false
			});

			$('#filterDateRange').on('apply.daterangepicker', function(ev, picker) {
				$(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
			});

			$('#filterDateRange').on('cancel.daterangepicker', function(ev, picker) {
				$(this).val('');
			});
		});
    // Initialiser DataTable avec récupération des données via AJAX
    const tableTransfers = $('#transfersTable').DataTable({
        ajax: {
            url: '/api/transferts',
            dataSrc: '',
            data: function (d) {
                // Ajout des paramètres de filtre à la requête
                d.status = $('#filterStatus').val();
                d.type = $('#filterType').val();
                d.clientType = $('#filterClientType').val();
                d.dateFrom = $('#filterDateFrom').val();
                d.dateTo = $('#filterDateTo').val();
                d.search = $('#filterSearch').val();
            }
        },
        columns: [
            {
                data: 'type',
                render: function (data) {
                    const types = {
                        'standard': '<span class="badge bg-primary">Envoi Cash</span>',
                        'byAccount': '<span class="badge bg-info">Retrait compte</span>'
                    };
                    return types[data] || data;
                }
            },
            {
                data: 'expediteur',
                render: function (data, type, row) {
                    if (row.clientType === 'ephemeral') {
                        return `
                                    <div class="fw-bold">${data}</div>
                                    <small class="text-muted">Client éphémère</small>
                                `;
                    } else {
                        return `
                                    <div class="fw-bold">${data}</div>
                                    <small class="text-muted">Client enregistré</small>
                                `;
                    }
                }
            },
            {
                data: 'montantCash',
                render: function (data) {
                    return `<span class="text-success fw-bold">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end'
            },
            {
                data: 'taux',
                render: function (data) {
                    return `<span class="text-primary">${parseFloat(data).toLocaleString('fr-FR')}</span>`;
                },
                className: 'text-end'
            },
            {
                data: 'frais',
                render: function (data) {
                    return `<span class="text-danger">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end'
            },
            {
                data: null,
                render: function (data, type, row) {
                    const total = parseFloat(row.montantCash) + parseFloat(row.frais);
                    return `<span class="fw-bold">${total.toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end'
            },
            {
                data: 'status',
                render: function (data) {
                    const statusMap = {
                        'completed': { class: 'badge-completed', text: 'Complété', icon: 'check-circle' },
                        'pending': { class: 'badge-pending', text: 'En attente', icon: 'hourglass' },
                        'cancelled': { class: 'badge-cancelled', text: 'Annulé', icon: 'x-circle' },
                        'processing': { class: 'badge-processing', text: 'En cours', icon: 'arrow-repeat' }
                    };
                    const status = statusMap[data] || { class: '', text: data, icon: '' };
                    return `
                                <span class="badge-status ${status.class}">
                                    <i class="bi bi-${status.icon} me-1"></i>${status.text}
                                </span>
                            `;
                }
            },
            {
                data: null,
                render: function (data, type, row) {
                    let actions = `
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-primary dropdown-toggle btn-table-action" type="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-gear"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li><a class="dropdown-item view-transfer" href="#" data-id="${row.id}"><i class="bi bi-eye me-2"></i>Voir</a></li>
                                        <li><a class="dropdown-item print-transfer" href="#" data-id="${row.id}"><i class="bi bi-printer me-2"></i>Imprimer</a></li>
                            `;

                    if (row.status === 'pending') {
                        actions += `
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item validate-transfer" href="#" data-id="${row.id}"><i class="bi bi-check-circle me-2"></i>Valider</a></li>
                                    <li><a class="dropdown-item cancel-transfer" href="#" data-id="${row.id}"><i class="bi bi-x-circle me-2"></i>Annuler</a></li>
                                `;
                    }

                    if (row.status !== 'completed') {
                        actions += `
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item delete-transfer" href="#" data-id="${row.id}"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                                `;
                    }

                    actions += `</ul></div>`;
                    return actions;
                },
                orderable: false,
                className: 'text-center'
            }
        ],
        order: [[0, 'desc']],
        dom: '<"row mb-3"<"col-md-6"l><"col-md-6"f>>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
        language: {
            search: "Rechercher:",
            lengthMenu: "Afficher _MENU_ éléments par page",
            info: "Affichage de _START_ à _END_ sur _TOTAL_ éléments",
            paginate: {
                first: "Premier",
                last: "Dernier",
                next: "Suivant",
                previous: "Précédent"
            }
        },
        initComplete: function () {
            // Ajout des filtres personnalisés
            $('#transfersTable_filter').prepend(`
                        <div class="btn-group ms-2">
                            <select id="filterStatus" class="form-select form-select-sm">
                                <option value="">Tous statuts</option>
                                <option value="completed">Complété</option>
                                <option value="pending">En attente</option>
                                <option value="cancelled">Annulé</option>
                                <option value="processing">En cours</option>
                            </select>
                            <select id="filterType" class="form-select form-select-sm">
                                <option value="">Tous types</option>
                                <option value="standard">Envoi Cash</option>
                                <option value="byAccount">Retrait compte</option>
                            </select>
                            <select id="filterClientType" class="form-select form-select-sm">
                                <option value="">Tous clients</option>
                                <option value="regular">Clients enregistrés</option>
                                <option value="ephemeral">Clients éphémères</option>
                            </select>
                        </div>
                    `);

            // Écouteurs d'événements pour les filtres
            $('#filterStatus, #filterType, #filterClientType').change(function () {
                tableTransfers.ajax.reload();
            });

            // Bouton d'actualisation
            $('#refreshTable').click(function () {
                tableTransfers.ajax.reload();
            });
        }
    }); 
 

    let currentTransferData = null;
    
    // Ouvrir le modal avec les données du transfert
    function openViewTransferModal(transferId) {
        // Simulation de données - remplacer par un appel AJAX réel
        $.get('/api/transferts/' + transferId, function(data) {
            currentTransferData = data;
            
            // Remplir les informations générales
            $('#transferReference').text(data.reference);
            $('#transferDate').text(new Date(data.createdAt).toLocaleDateString());
            $('#transferType').html(data.type === 'standard' ? 
                '<span class="badge bg-primary">Envoi Cash</span>' : 
                '<span class="badge bg-info">Retrait compte</span>');
            $('#transferDestination').text(countryCodeCurrency[data.destination]['capital'] + ' - ' + countryCodeCurrency[data.destination]['countryName'] ); 
            
            // Remplir le statut avec le badge approprié
            let statusBadge = '';
            switch(data.status) {
                case 'completed':
                    statusBadge = '<span class="badge bg-success">Complété</span>';
                    break;
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">En attente</span>';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="badge bg-danger">Annulé</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">' + data.status + '</span>';
            }
            $('#transferStatus').html(statusBadge);
            
            // Remplir les informations de l'expéditeur
            $('#senderName').text(data.expediteur);
            $('#senderPhone').text(data.phone || '--');
            $('#senderType').text(data.clientType === 'ephemeral' ? 'Client éphémère' : 'Client enregistré');
            $('#senderId').text(data.expediteurId || '--');
            
            // Remplir les informations du bénéficiaire
            $('#beneficiaryName').text(data.receiverName || '--');
            $('#beneficiaryPhone').text(data.receiverPhone || '--'); 
            // Remplir les montants
            $('#transferAmount').text(data.montantCash.toLocaleString('fr-FR') + ' F CFA');
            $('#transferFees').text(data.frais.toLocaleString('fr-FR') + ' F CFA');
            $('#transferRate').text('1 USD = ' + data.taux.toLocaleString('fr-FR') + ' F CFA');
            $('#transferAmountUSD').text((data.montantCash / data.taux).toLocaleString('fr-FR') + ' USD');
            $('#deviseDestination').text(countryCodeCurrency[data.destination]['currencyName']); 
            $('#destinationRate').text('1 USD = ' + data.tauxDeviseReception.toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination]['currency']);
            $('#destinationAmount').text((data.montantCash / data.taux * data.tauxDeviseReception ).toLocaleString('fr-FR') +  ' ' + countryCodeCurrency[data.destination]['currency']);
            
            const total = parseFloat(data.montantCash) + parseFloat(data.frais);
            $('#transferTotal').text(total.toLocaleString('fr-FR') + ' F CFA');
             
            // Afficher/masquer les boutons d'action selon le statut
            toggleActionButtons(data.status);
            
            // Afficher le modal
            $('#viewTransferModal').modal('show');
        }).fail(function() {
            toastr.error('Erreur lors du chargement des données du transfert');
        });
    }
    
    // Afficher/masquer les boutons d'action selon le statut
    function toggleActionButtons(status) {
        // Masquer tous les boutons d'abord
        $('#validateTransferBtn, #cancelTransferBtn, #deleteTransferBtn').addClass('d-none');
        
        // Afficher les boutons appropriés
        switch(status) {
            case 'pending':
                $('#validateTransferBtn, #cancelTransferBtn').removeClass('d-none');
                break;
            case 'cancelled':
                $('#deleteTransferBtn').removeClass('d-none');
                break;
            case 'completed':
                // Aucun bouton supplémentaire pour les transferts complétés
                break;
        }
    }

    // Écouteurs pour les autres actions
    $('#validateTransferBtn').click(function() {
        if (confirm('Confirmer la validation de ce transfert?')) {
            $.post('/api/transferts/' + currentTransferData.id + '/validate', function() {
                toastr.success('Transfert validé avec succès');
                $('#viewTransferModal').modal('hide');
                tableTransfers.ajax.reload();
            }).fail(function() {
                toastr.error('Erreur lors de la validation du transfert');
            });
        }
    });
    
    $('#cancelTransferBtn').click(function() {
        if (confirm('Confirmer l\'annulation de ce transfert?')) {
            $.post('/api/transferts/' + currentTransferData.id + '/cancel', function() {
                toastr.success('Transfert annulé avec succès');
                $('#viewTransferModal').modal('hide');
                tableTransfers.ajax.reload();
            }).fail(function() {
                toastr.error('Erreur lors de l\'annulation du transfert');
            });
        }
    });
    
    $('#deleteTransferBtn').click(function() {
        if (confirm('Confirmer la suppression définitive de ce transfert?')) {
            $.ajax({
                url: '/api/transferts/' + currentTransferData.id,
                type: 'DELETE',
                success: function() {
                    toastr.success('Transfert supprimé avec succès');
                    $('#viewTransferModal').modal('hide');
                    tableTransfers.ajax.reload();
                },
                error: function() {
                    toastr.error('Erreur lors de la suppression du transfert');
                }
            });
        }
    });
    
    // Écouteur pour l'impression du reçu
    $('#printReceiptBtn').click(function() {
        window.open('/api/transferts/' + currentTransferData.id + '/receipt', '_blank');
    });
    
    // Écouteur pour le téléchargement du reçu
    $('#downloadReceiptBtn').click(function() {
        window.location.href = '/api/transferts/' + currentTransferData.id + '/receipt?download=1';
    });
    
    // Dans votre code DataTables, ajoutez cet écouteur pour ouvrir le modal
    $('#transfersTable').on('click', '.view-transfer', function(e) {
        e.preventDefault();
        const transferId = $(this).data('id');
        openViewTransferModal(transferId);
    });
 
});