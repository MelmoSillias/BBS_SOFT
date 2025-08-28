$(document).ready(function () {
    const countryCodeCurrency = {
        'EAU': { code: "EAU", countryName: "Émirats Arabes Unis", capital: "Abou Dabi", currency: "AED", currencyName: "Dirham des Émirats Arabes Unis", USDValue: 3.67 },
        'FR': { code: "FR", countryName: "France", capital: "Paris", currency: "EUR", currencyName: "Euro", USDValue: 0.93 },
        'USA': { code: "USA", countryName: "États-Unis", capital: "Washington, D.C.", currency: "USD", currencyName: "Dollar américain", USDValue: 1.00 },
        'UK': { code: "UK", countryName: "Royaume-Uni", capital: "Londres", currency: "GBP", currencyName: "Livre sterling", USDValue: 0.80 },
        'CHI': { code: "CHI", countryName: "Chine", capital: "Pékin", currency: "CNY", currencyName: "Yuan chinois", USDValue: 7.24 },
        'MRC': { code: "MRC", countryName: "Maroc", capital: "Rabat", currency: "MAD", currencyName: "Dirham marocain", USDValue: 10.03 },
        'ALG': { code: "ALG", countryName: "Algérie", capital: "Alger", currency: "DZD", currencyName: "Dinar algérien", USDValue: 133.40 }
    };

    let clients = [];
    let currentTransferData = null;
    let transferId;
    let startTransfertDate
    let endTransfertDate
    const apiUrl = '/api/clients';

    $.get(apiUrl, function (data) {

        if (data && data.data) {
            clients = data.data.map(item => ({
                id: item.id,
                text: `${item.nomComplet} (Tél: ${item.phoneNumber}, Solde: ${item.balance})`,
                phone: item.phoneNumber,
                balance: item.balance
            }));
        }
    }).fail(function () {
        showToastModal({ message: 'Erreur de connexion', type: 'error' });
    });
    // Initialiser Select2 pour le sélecteur d'expéditeur
    $('#select-expediteur').select2({
        placeholder: "Rechercher un client...",
        allowClear: true,
        width: '100%',
    });

    $('#filterDateRange').daterangepicker({
        locale: {
            format: 'YYYY-MM-DD',
            applyLabel: 'Appliquer',
            cancelLabel: 'Annuler',
            daysOfWeek: [
                'Di',
                'Lu',
                'Ma',
                'Me',
                'Je',
                'Ve',
                'Sa'
            ],
            monthNames: [
                'Janvier',
                'Février',
                'Mars',
                'Avril',
                'Mai',
                'Juin',
                'Juillet',
                'Août',
                'Septembre',
                'Octobre',
                'Novembre',
                'Décembre'
            ],
            firstDay: 1
        },
        opens: 'left',
        alwaysShowCalendars: true,
        ranges: {
            "Aujourd'hui": [
                moment(), moment()
            ],
            "Hier": [
                moment().subtract(1, 'days'),
                moment().subtract(1, 'days')
            ],
            "Cette semaine": [
                moment().startOf('week'), moment().endOf('week')
            ],
            "Ce mois-ci": [
                moment().startOf('month'), moment().endOf('month')
            ],
            "Cette année": [moment().startOf('year'), moment().endOf('year')]
        },
        opens: 'right',
        autoUpdateInput: false
    });

    // Mettre à jour les champs cachés avec les dates sélectionnées
    $('#filterDateRange').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startTransfertDate =  picker.startDate.format('YYYY-MM-DD');
        endTransfertDate =  picker.endDate.format('YYYY-MM-DD');

        // Recharger la table avec les nouvelles dates
        tableTransfers.ajax.reload();
        chargerStatsTransferts(); 
    });

    $('#filterDateRange').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        startTransfertDate = null;
        endTransfertDate = null;

        // Recharger la table avec les dates effacées
        tableTransfers.ajax.reload();
        chargerStatsTransferts(); 
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
                d.dateFrom = startTransfertDate;
                d.dateTo = endTransfertDate;
            }
        },
        columns: [
            {
                data: 'createdAt',  
                visible: false,
            },
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
                                    <small class="text-muted">${row.typeClient}</small>
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
                                        <li><a class="dropdown-item view-transfer" href="#" data-id="${row.id}" ><i class="bi bi-eye me-2"></i>Voir</a></li>
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
        dom: 'Bflrtip',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
        className: 'btn btn-success',
        titleAttr: 'Exporter vers Excel',
        title: 'Liste des clients',
        exportOptions: { columns: [0,1,2,3] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
        className: 'btn btn-danger',
        titleAttr: 'Exporter vers PDF',
        title: 'Liste des transferts',
        exportOptions: { columns: [0,1,2,3] },
        customize: function(doc) {
          doc.content[1].table.widths = ['*','*','*','*'];
          doc.content[1].table.body[0].forEach(cell => {
            cell.fillColor = '#007bff';
            cell.color     = '#ffffff';
          });
        }
      }
    ],
        language: { url: '/api/datatable_json_fr' },
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
            $('#filterStatus, #filterType, #filterClientType, #filterDateRange').on('change', function() {
                tableTransfers.ajax.reload();
                chargerStatsTransferts(); 
            }); 
        }
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
        disableButton($btn)

        // Validation
        const type = $('[name="type"]').val();
        const expediteurId = $('#select-expediteur').find(':selected').val();
        const isNewClient = expediteurId === 'vanish'; // Vérifie si l'option "Client éphémère" est sélectionnée

        if (type === 'byAccount' && !expediteurId) {
            showToastModal({ message: "Pour un retrait sur compte, vous devez sélectionner un client existant.", type: 'error', duration: 1000 });
            return;
        }

        if (isNewClient) {
            const nom = $('[name="newExpediteurNom"]').val();
            const phone = $('[name="newExpediteurPhone"]').val();
            if (!nom || !phone) {
                showToastModal({ message: "Veuillez remplir les champs du client éphémère", type: 'error', duration: 1000 });
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
                tableTransfers.reload()
                calculerMontants();
            },
            error: function (xhr, status, error) {
                showToastModal({ message: !error && error != "" ? error : "Erreur de connexion", type: 'error' })
            }
        });
    });  
    // Ouvrir le modal avec les données du transfert
    function openViewTransferModal(transferId) {
        // Simulation de données - remplacer par un appel AJAX réel
        $.get('/api/transferts/' + transferId, function (data) {
            currentTransferData = data;

            // Remplir les informations générales
            $('#transferReference').text(data.reference);
            $('#transferDate').text(new Date(data.createdAt).toLocaleDateString());
            $('#transferType').html(data.type === 'standard' ?
                '<span class="badge bg-primary">Envoi Cash</span>' :
                '<span class="badge bg-info">Retrait compte</span>');
            $('#transferDestination').text(countryCodeCurrency[data.destination]['capital'] + ' - ' + countryCodeCurrency[data.destination]['countryName']);

            // Remplir le statut avec le badge approprié
            let statusBadge = '';
            switch (data.status) {
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
            $('#destinationAmount').text((data.montantCash / data.taux * data.tauxDeviseReception).toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination]['currency']);

            const total = parseFloat(data.montantCash) + parseFloat(data.frais);
            $('#transferTotal').text(total.toLocaleString('fr-FR') + ' F CFA');

            // Afficher/masquer les boutons d'action selon le statut
            toggleActionButtons(data.status);

            // Afficher le modal
            $('#viewTransferModal').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Afficher/masquer les boutons d'action selon le statut
    function toggleActionButtons(status) {
        // Masquer tous les boutons d'abord
        $('#validateTransferBtn, #cancelTransferBtn, #deleteTransferBtn').addClass('d-none');

        // Afficher les boutons appropriés
        switch (status) {
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
    // Fonction pour prévenir les doubles envois
    function disableButton(button) {
        button.prop('disabled', true);
        setTimeout(() => {
            button.prop('disabled', false);
        }, 3000); // Réactiver après 3 secondes
    }

    $('#validateTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmValidateModal').modal('show');
    });

    $('#cancelTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmCancelModal').modal('show');
    });

    $('#deleteTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmDeleteModal').modal('show');
    });


    // Écouteurs pour ouvrir les modales de confirmation
    $('#transfersTable').on('click', '.validate-transfer', function () {
        transferId = $(this).data('id');
        $('#confirmValidateModal').modal('show');
    });

    $('#transfersTable').on('click', '.cancel-transfer', function () {
        transferId = $(this).data('id');
        $('#confirmCancelModal').modal('show');
    });

    $('#transfersTable').on('click', '.delete-transfer', function () {
        transferId = $(this).data('id');
        $('#confirmDeleteModal').modal('show');
    });

    // Écouteurs pour les actions de confirmation
    $('#confirmValidate').click(function () {
        const button = $(this);
        disableButton(button);

        $.post('/api/transferts/' + transferId + '/validate', function () {
            showToastModal({ message: 'Transfert validé avec succès!', type: 'success' });
            $('#confirmValidateModal').modal('hide');
            $('#viewTransferModal').modal('hide');
            tableTransfers.ajax.reload();
        }).fail(function () {
            showToastModal({ message: 'Erreur lors de la validation du transfert', type: 'error' });
        });
    });

    $('#confirmCancel').click(function () {
        const button = $(this);
        disableButton(button);

        $.post('/api/transferts/' + transferId + '/cancel', function () {
            showToastModal({ message: 'Transfert annulé avec succès!', type: 'success' });
            $('#confirmCancelModal').modal('hide');
            $('#viewTransferModal').modal('hide');
            tableTransfers.ajax.reload();
        }).fail(function () {
            showToastModal({ message: 'Erreur lors de l\'annulation du transfert', type: 'error' });
        });
    });

    $('#confirmDelete').click(function () {
        const button = $(this);
        disableButton(button);

        $.ajax({
            url: '/api/transferts/' + transferId + '/delete',
            type: 'DELETE',
            success: function () {
                showToastModal({ message: 'Transfert supprimé avec succès!', type: 'success' });
                $('#confirmDeleteModal').modal('hide');
                $('#viewTransferModal').modal('hide');
                tableTransfers.ajax.reload();
            },
            error: function () {
                showToastModal({ message: 'Erreur lors de la suppression du transfert', type: 'error' });
            }
        });
    }); 

    function chargerStatsTransferts() {
        $.ajax({
            url: '/api/transferts/stats',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                $('#stat-total').text(data.nombre_total ?? 0);
                $('#stat-valide').text(data.par_statut?.valide ?? 0);
                $('#stat-attente').text(data.par_statut?.en_attente ?? 0);
                $('#stat-annule').text(data.par_statut?.annule ?? 0);

                $('#stat-enregistres').text(data.par_type_client?.enregistre ?? 0);
                $('#stat-ephemeres').text(data.par_type_client?.ephemere ?? 0);

                $('#stat-montant').text(formatMontant(data.montant_total_cash ?? 0));
                $('#stat-recu').text(formatMontant(data.montant_total_reception ?? 0));
                $('#stat-frais').text(formatMontant(data.frais_totaux ?? 0));
            },
            error: function(xhr, status, error) {
                console.error('Erreur chargement statistiques:', error);
                showToastModal({ message: 'Erreur de connexion', type: 'error' });
            }
        });
    }

    function formatMontant(valeur) {
        return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
    }
  
    // Écouteur pour l'impression du reçu
    $('#transfersTable').on('click', '.print-transfer', function () {
        transferId = $(this).data('id');
        window.open('/api/transferts/' + transferId + '/receipt', '_blank');
    });

    // Écouteur pour le téléchargement du reçu
    $('#transfersTable').on('click', '.download-transfer', function () {
        transferId = $(this).data('id');
        window.location.href = '/api/transferts/' + transferId + '/receipt?download=1';
    });

    // Écouteur pour ouvrir le modal de visualisation
    $('#transfersTable').on('click', '.view-transfer', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openViewTransferModal(id);
    });

    calculerMontants();
    chargerStatsTransferts(); 
});