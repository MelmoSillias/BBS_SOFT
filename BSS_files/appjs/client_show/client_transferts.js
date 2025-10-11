
function initTranferts(clientId) {

    let transferId;
    let startTransfertDate;
    let endTransfertDate;

    $('#filterDateRange').daterangepicker({
        locale: {
            format: 'YYYY-MM-DD',
            applyLabel: 'Appliquer',
            cancelLabel: 'Annuler',
            daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
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
    $('#filterDateRange').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startTransfertDate = picker.startDate.format('YYYY-MM-DD');
        endTransfertDate = picker.endDate.format('YYYY-MM-DD');

        // Recharger la table avec les nouvelles dates
        tableTransfers.ajax.reload();
        chargerStatsTransferts();
    });

    $('#filterDateRange').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startTransfertDate = null;
        endTransfertDate = null;

        // Recharger la table avec les dates effacées
        tableTransfers.ajax.reload();
        chargerStatsTransferts();
    });

    const tableTransfers = $('#transfersTable').DataTable({
        ajax: {
            url: `/api/client/${extractClientId()}/transferts`,
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
                data: 'receiverName',
            },
            {
                data: 'montantCFA',
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
                    const total = parseFloat(row.montantCFA) + parseFloat(row.frais);
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
                                            <li><a class="dropdown-item modify-transfer" href="#" data-id="${row.id}" ><i class="bi bi-eye me-2"></i>Modifier</a></li>
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
                title: 'Liste des transferts',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7],
                    format: {
                        body: function (data, row, column, node) {
                            // Nettoyer le contenu HTML pour Excel
                            if (column === 1) { // Type
                                return $(data).text() || data;
                            }
                            if (column === 2) { // Expéditeur
                                return $(data).find('.fw-bold').text() || data;
                            }
                            if (column === 3 || column === 5 || column === 6) { // Montant, Frais, Total
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            if (column === 7) { // Statut
                                return $(data).text().trim() || data;
                            }
                            return data;
                        }
                    }
                },
                customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];

                    // Modifier le style des en-têtes
                    $('row:first c', sheet).attr('s', '2');
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Liste des transferts',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7],
                    format: {
                        body: function (data, row, column, node) {
                            // Nettoyer le contenu HTML pour PDF
                            if (column === 1) { // Type
                                return $(data).text() || data;
                            }
                            if (column === 2) { // Expéditeur
                                return $(data).find('.fw-bold').text() || data;
                            }
                            if (column === 3 || column === 5 || column === 6) { // Montant, Frais, Total
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            if (column === 7) { // Statut
                                return $(data).text().trim() || data;
                            }
                            return data;
                        }
                    }
                },
                customize: function (doc) {
                    // Structure simple pour le PDF
                    doc.content[1].table.widths = ['*', '*', '*', '*', '*', '*', '*', '*'];
                    doc.styles.tableHeader.fillColor = '#007bff';
                    doc.styles.tableHeader.color = '#ffffff';
                    doc.styles.tableHeader.alignment = 'center';

                    // Personnaliser les cellules du corps
                    doc.content[1].table.body.forEach(function (row, i) {
                        if (i > 0) { // Ignorer l'en-tête
                            // Alignement des colonnes numériques à droite
                            row[3].alignment = 'right';
                            row[4].alignment = 'right';
                            row[5].alignment = 'right';
                            row[6].alignment = 'right';
                        }
                    });

                    // Ajouter "F CFA" aux montants
                    for (var i = 1; i < doc.content[1].table.body.length; i++) {
                        doc.content[1].table.body[i][3] = { text: doc.content[1].table.body[i][3] + ' F CFA', alignment: 'right' };
                        doc.content[1].table.body[i][5] = { text: doc.content[1].table.body[i][5] + ' F CFA', alignment: 'right' };
                        doc.content[1].table.body[i][6] = { text: doc.content[1].table.body[i][6] + ' F CFA', alignment: 'right' };
                    }
                }
            }
        ],
        language: {
            url: '/api/datatable_json_fr'
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
            $('#filterStatus, #filterType, #filterClientType, #filterDateRange').on('change', function () {
                tableTransfers.ajax.reload();
                // chargerStatsTransferts(); 
            });
        }
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
            $('#transferDestination').text(countryCodeCurrency[data.destination.abg]['capital'] + ' - ' + countryCodeCurrency[data.destination.abg]['countryName']);

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
            $('#transferAmount').text(data.montantCFA.toLocaleString('fr-FR') + ' F CFA');
            $('#transferFees').text(data.frais.toLocaleString('fr-FR') + ' F CFA');
            $('#transferRate').text('1 USD = ' + data.taux.toLocaleString('fr-FR') + ' F CFA');
            $('#transferAmountUSD').text((data.montantUSD).toLocaleString('fr-FR') + ' USD');
            $('#deviseDestination').text(countryCodeCurrency[data.destination.abg]['currencyName']);
            $('#destinationRate').text('1 USD = ' + (destination.abg === "EAU" ? 3.67 : (data.montantReception / data.montantUSD).toLocaleString('fr-FR')) + ' ' + countryCodeCurrency[data.destination.abg]['currency']);
            $('#destinationAmount').text((data.montantReception).toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination.abg]['currency']);

            const total = parseFloat(data.montantCFA) + parseFloat(data.frais);
            $('#transferTotal').text(total.toLocaleString('fr-FR') + ' F CFA');

            // Afficher/masquer les boutons d'action selon le statut
            toggleActionButtons(data.status);

            // Afficher le modal
            $('#viewTransferModal').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
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

    $('#transfersTable').on('click', '.validate-transfer', function () {
        transferId = $(this).data('id');
        $('#valid-date').val(new Date().toISOString().split('T')[0])
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

    $('#confirmValidate').click(function () {
        const button = $(this);
        disableButton(button);

        const valid_date = $('#valid-date').val()

        $.post('/api/transferts/' + transferId + '/validate/' + valid_date, function () {
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

     $('#destinationEdit').change(function () {
        const destination = $(this).find(':selected').val();
        $.get(`/api/agence/${destination}`, function (data, status) {
            const abg = data['abg'];
            $('#deviseRecueDisplayEdit').text(countryCodeCurrency[abg].currency);
            $('#nomDeviseReceptionTauxEdit').html(
                `${countryCodeCurrency[abg].currencyName} <span class="text-danger">*</span>`
            );
            $('#tauxReceptionEdit').val(countryCodeCurrency[abg].USDValue);
            calculerMontantsEdit();
        });
    });

    $("#resetFormEdit").on('click', () => {
        $('#totalAPayerEdit').text('0.00 CFA');
    });

    

    // Calculate amounts when inputs change in edit modal
    $('#montantCashEdit, #fraisEnvoiEdit, #tauxEdit, #tauxReceptionEdit').on('input', calculerMontantsEdit);

    // Submit handler for edit form
    $('#btnEditClientTransfert').on('click', function (e) {
        e.preventDefault();

        const $form = $('#form-edit-transfer');
        const $btn = $form.find('button[type="submit"]');
        const id = $('#modalEditTransfert').data('id')
        disableButton($btn);

        const formData = {
            date: $('#dateOpsEdit').val(),
            type: $('#typeOpsTEdit').val(),
            destination: $('#destinationEdit').val(),
            expediteur: clientId,
            nomBeneficiaire: $('#nomBeneficiaireEdit').val(),
            phoneBeneficiaire: $('#phoneBeneficiaireEdit').val(),
            montantCash: $('#montantCashEdit').val(),
            fraisEnvoi: $('#fraisEnvoiEdit').val(),
            taux: $('#tauxEdit').val(),
            montantUSD: $('#montantRecuEdit').val(),
            tauxReception: $('#tauxReceptionEdit').val(),
            montantDeviseReception: $('#montantDeviseReceptionEdit').val(),
            totalAPayer: $('#totalAPayerEdit').text(),
            moneyReceived: $('#moneyReceivedEdit').prop('checked')
        };

        // Send data via AJAX
        $.ajax({
            url: `/api/transfert/update/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Transfert modifié avec succès', type: 'success' });
                $('#form-edit-transfer').trigger("reset");
                $('#modalEditTransfert').modal('hide');
                tableTransfers.ajax.reload();
                calculerMontantsEdit();
            },
            error: function (xhr, status, error) {
                showToastModal({ message: error || "Erreur de connexion", type: 'error' });
            },
            complete: function () {
                enableButton($btn);
            }
        });
    });

    $('#transfersTable').on('click', '.print-transfer', function () {
        transferId = $(this).data('id');
        window.open('/api/transferts/' + transferId + '/receipt', '_blank');
    });
 
    $('#transfersTable').on('click', '.download-transfer', function () {
        transferId = $(this).data('id');
        window.location.href = '/api/transferts/' + transferId + '/receipt?download=1';
    });
 
    $('#transfersTable').on('click', '.view-transfer', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openViewTransferModal(id);
    });

    $('#transfersTable').on('click', '.modify-transfer', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        populateEditModal(id);
    });

    // Handlers for Edit Transfer Modal
    let currentTransferId = null;

   
    function chargerStatsTransferts() {
        $.ajax({
            url: `/api/client/${clientId}/transferts/stats`,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#stat-total').text(data.nombre_total ?? 0);
                $('#stat-valide').text(data.par_statut?.valide ?? 0);
                $('#stat-attente').text(data.par_statut?.en_attente ?? 0);
                $('#stat-annule').text(data.par_statut?.annule ?? 0);

                $('#stat-montant').text(formatMontant(data.montant_total_cash ?? 0));
                $('#stat-recu').text(formatMontant(data.montant_total_reception ?? 0));
                $('#stat-frais').text(formatMontant(data.frais_totaux ?? 0));
            },
            error: function (xhr, status, error) {
                console.error('Erreur chargement statistiques:', error);
                showToastModal({ message: 'Erreur de connexion', type: 'error' });
            }
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

    chargerStatsTransferts();
}
