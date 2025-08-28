$(document).ready(function () {
    // Variables globales
    let agences = []; // Liste des agences
    let currentExchangeId = null; // ID de l'échange en cours de traitement
    let exchangesTable, agencesTable; // Tables DataTables

    // Initialisation des composants
    function initComponents() {
        // Initialisation du date range picker
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

        $('#filterDateRange').on('apply.daterangepicker', function (ev, picker) {
            $(this).val(picker.startDate.format('DD/MM/YYYY') + ' - ' + picker.endDate.format('DD/MM/YYYY'));
            loadExchanges();
        });

        $('#filterDateRange').on('cancel.daterangepicker', function (ev, picker) {
            $(this).val('');
            loadExchanges();
        });


        // Initialisation de la date du jour
        $('#dateOps').val(new Date().toISOString().split('T')[0]);

        // Chargement initial des données
        loadAgences();
        initExchangesTable();
        initAgencesTable();
        updateStats();

        // Écouteurs d'événements
        setupEventListeners();
    }

    // Initialisation de la table des échanges
    function initExchangesTable() {
        exchangesTable = $('#exchangesTable').DataTable({
            dom: 'Bflrtip',
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
                    className: 'btn btn-success',
                    titleAttr: 'Exporter vers Excel',
                    title: 'Liste des clients',
                    exportOptions: { columns: [0, 1, 2, 3] }
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                    className: 'btn btn-danger',
                    titleAttr: 'Exporter vers PDF',
                    title: 'Liste des clients',
                    exportOptions: { columns: [0, 1, 2, 3] },
                    customize: function (doc) {
                        doc.content[1].table.widths = ['*', '*', '*', '*'];
                        doc.content[1].table.body[0].forEach(cell => {
                            cell.fillColor = '#007bff';
                            cell.color = '#ffffff';
                        });
                    }
                }
            ],
            language: { url: '/api/datatable_json_fr' },
            processing: true,
            serverSide: false,
            ajax: {
                url: '/api/exchanges', // Remplacez par votre endpoint API
                type: 'GET',
                data: function (d) {
                    // Ajout des filtres aux paramètres de la requête
                    const dateRange = $('#filterDateRange').val();
                    if (dateRange) {
                        const dates = dateRange.split(' - ');
                        d.startDate = dates[0];
                        d.endDate = dates[1];
                    }
                    d.type = $('#filterType').val();
                    d.agence = $('#filterAgence').val();
                },
                dataSrc: 'data'
            },
            columns: [
                {
                    data: 'date', render: function (data) {
                        return formatDate(data);
                    }
                },
                {
                    data: 'agence',
                    render: function (data, type, row) {
                        // Afficher le nom de l'agence avec la devise entre parenthèses
                        return `${data.name} (${row.fromCurrency})`;
                    }
                },
                {
                    data: 'client',
                },
                {
                    data: 'type',
                    render: function (data, type, row) {
                        // Afficher le type dans un badge
                        const color = data === 'achat' ? 'bg-info' : 'bg-warning';
                        return `<span class="badge ${color}">${data}</span>`;
                    }
                },
                {
                    data: 'toAmount',
                    render: function (data, type, row) {
                        // Afficher le montant de la devise avec couleur en fonction du type
                        const color = row.type === 'achat' ? 'text-success' : 'text-danger';
                        const sign = row.type === 'achat' ? '+' : '-';
                        return `<span class="${color}">${sign}${data.toLocaleString()}</span>`;
                    }
                },
                {
                    data: 'fromAmount',
                    render: function (data, type, row) {
                        // Afficher le montant CFA avec couleur en fonction du type
                        const color = row.type === 'vente' ? 'text-success' : 'text-danger';
                        const sign = row.type === 'vente' ? '+' : '-';
                        return `<span class="${color}">${sign}${data.toLocaleString()}</span>`;
                    }
                },
                {
                    data: 'id', render: function (data, type, row) {
                        let buttons = `
                        <button class="btn btn-sm btn-outline-primary btn-table-action view-exchange" data-id="${data}" title="Voir">
                            <i class="bi bi-eye"></i>
                        </button>
                    `;

                        buttons += ` 
                        <button class="btn btn-sm btn-outline-danger btn-table-action cancel-exchange" data-id="${data}" title="Annuler">
                            <i class="bi bi-x-lg"></i>
                        </button>

                        <button href="#" class="btn btn-sm btn-outline-secondary btn-table-action print-exchange" data-id="${data}" title="Imprimer">
                            <i class="bi bi-printer"></i>
                        </button>
                    `;

                        return `<div class="btn-group">${buttons}</div>`;
                    }
                }
            ],
            order: [[0, 'desc']]
        });
    }

    // Initialisation de la table des agences
    function initAgencesTable() {
        agencesTable = $('#agencesTable').DataTable({
            dom: '<"top"f>rt<"bottom"lip><"clear">',
            language: { url: '/api/datatable_json_fr' },
            data: agences,
            columns: [
                { data: 'nom' },
                { data: 'devise' },
                { data: 'localite' },
                {
                    data: 'isActive', render: function (data) {
                        return data ?
                            '<span class="badge bg-success">Active</span>' :
                            '<span class="badge bg-secondary">Inactive</span>';
                    }
                },
                {
                    data: 'id', render: function (data, type, row) {
                        let buttons = `
                        <button class="btn btn-sm btn-outline-primary edit-agence" data-id="${data}" title="Modifier">
                            <i class="bi bi-pencil"></i>
                        </button>
                    `;

                        if (row.isActive) {
                            buttons += `
                            <button class="btn btn-sm btn-warning desactivate-agence" data-id="${data}" title="Désactiver">
                                <i class="bi bi-power"></i>
                            </button>
                        `;
                        } else {
                            buttons += `
                            <button class="btn btn-sm btn-success activate-agence" data-id="${data}" title="Activer">
                                <i class="bi bi-power"></i>
                            </button>
                        `;
                        }

                        return `<div class="btn-group">${buttons}</div>`;
                    }
                }
            ]
        });
    }

    // Chargement des agences
    function loadAgences() {

        $.get('/api/agences', function (data) {
            agences = data;
            updateAgencesSelect();
            agencesTable.clear().rows.add(agences).draw();
        });

        updateAgencesSelect();
        if (agencesTable) {
            agencesTable.clear().rows.add(agences).draw();
        }
    }

    // Mise à jour des selects d'agences
    function updateAgencesSelect() {
        const agenceSelects = ['#filterAgence', '#agence'];
        $('#filterAgence').empty().append('<option value="">Toutes agences</option>');
        $('#agence').empty().append('<option value="" selected>Choisir une agence</option>');

        agenceSelects.forEach(select => {
            agences.filter(a => a.isActive).forEach(agence => {
                $(select).append(`<option value="${agence.id}">${agence.nom} (${agence.devise})</option>`);
            });
        });
    }

    // Chargement des échanges
    function loadExchanges() {
        exchangesTable.ajax.reload();
        updateStats()
    }

    // Mise à jour des statistiques
    function updateStats() {
        $.ajax({
            url: '/api/exchanges/stats',
            method: 'GET',
            dataType: 'json',
            success: function (stats) {
                $('#stat-total').text(stats.total);
                $('#stat-valide').text(stats.completed);
                $('#stat-attente').text(stats.pending);
                $('#stat-annule').text(stats.cancelled);
                $('#stat-achat').text(stats.achat);
                $('#stat-vente').text(stats.vente);
                $('#stat-montant-achat').text(formatMoney(stats.montant_achat) + ' FCFA');
                $('#stat-montant-vente').text(formatMoney(stats.montant_vente) + ' FCFA');
                $('#stat-localsolde').text(formatMoney(stats.local_solde) + ' FCFA');
                $('#stat-taux-moyen').text(stats.taux_moyen);
            },
            error: function () {
                showToastModal({
                    message: 'Erreur lors du chargement des statistiques',
                    type: 'error'
                });
            }
        });
    }


    // Configuration des écouteurs d'événements
    function setupEventListeners() {
        // Filtres
        $('#filterStatus, #filterType, #filterAgence').change(loadExchanges);
        $('#refreshTable').click(loadExchanges);

        // Formulaire d'échange
        $('#form-add-exchange').submit(handleExchangeSubmit);
        $('#typeOps').change(updateExchangeForm);
        $('#agence').change(updateExchangeForm);
        $('#montant, #taux').on('input', calculateTotal);

        // Actions sur les échanges
        $(document).on('click', '.view-exchange', showExchangeModal);
        $(document).on('click', '.validate-exchange', confirmValidateExchange);
        $(document).on('click', '.cancel-exchange', confirmCancelExchange);
        $(document).on('click', '.delete-exchange', confirmDeleteExchange);
        $(document).on('click', '.print-exchange', printReceipt);
        $('#confirmValidate').click(validateExchange);
        $('#form-cancel-exchange').submit(cancelExchange);
        $('#confirmDelete').click(deleteExchange);

        // Actions sur les agences
        $('#form-add-agence').submit(handleAgenceSubmit);
        $(document).on('click', '.edit-agence', editAgence);
        $(document).on('click', '.desactivate-agence', confirmDesactivateAgence);
        $(document).on('click', '.activate-agence', confirmActivateAgence);
        $('#confirmDesactivate').click(desactivateAgence);
        $('#confirmActivate').click(activateAgence);

        // Impression
        $('#printReceiptBtn').click(printReceipt);
    }

    // Gestion du formulaire d'échange
    function handleExchangeSubmit(e) {
        e.preventDefault();

        const form = $(this);
        const submitBtn = form.find('[type="submit"]');
        const originalText = submitBtn.html();

        // Désactivation du bouton pour éviter les doubles soumissions
        submitBtn.prop('disabled', true).html('<i class="bi bi-arrow-repeat spin me-2"></i>En cours...');

        // Validation des données
        const montant = parseFloat($('#montant').val());
        const taux = parseFloat($('#taux').val());

        if (montant <= 0 || taux <= 0) {
            showToastModal({
                message: 'Le montant et le taux doivent être supérieurs à zéro',
                type: 'error'
            });
            submitBtn.prop('disabled', false).html(originalText);
            return;
        }

        // En production, envoyer les données au serveur
        const formData = form.serialize();
        $.post('/api/exchanges', formData, function (response) {
            showToastModal({
                message: 'Échange créé avec succès',
                type: 'success'
            });
            form.trigger('reset');
            loadExchanges();
        }).fail(function (error) {
            showToastModal({
                message: error.responseJSON?.message || 'Erreur lors de la création',
                type: 'error'
            });
        }).always(function () {
            submitBtn.prop('disabled', false).html(originalText);
        });

    }

    // Mise à jour du formulaire d'échange
    function updateExchangeForm() {
        const type = $('#typeOps').val();
        const agenceId = $('#agence').val();
        const agence = agences.find(a => a.id == agenceId);

        if (agence) {
            $('#devise').text(agence.devise);
            $('#deviseAgenceDisplay').text(agence.devise);

            // Mise à jour du placeholder du taux selon le type
            if (type === 'achat') {
                $('#taux').attr('placeholder', 'Taux d\'achat');
            } else {
                $('#taux').attr('placeholder', 'Taux de vente');
            }

            calculateTotal();
        } else {
            $('#devise').text('-');
            $('#deviseAgenceDisplay').text('-');
            $('#totalAPayer').text('0.00 CFA');
        }
    }

    // Calcul du total à payer
    function calculateTotal() {
        const type = $('#typeOps').val();
        const montant = parseFloat($('#montant').val()) || 0;
        const taux = parseFloat($('#taux').val()) || 0;
        const total = montant * taux;

        if (total > 0) {
            if (type === 'achat') {
                $('#totalAPayer').text('-' + formatMoney(total) + ' CFA').removeClass('text-success').addClass('text-danger');
            } else {
                $('#totalAPayer').text('+' + formatMoney(total) + ' CFA').removeClass('text-danger').addClass('text-success');
            }
        } else {
            $('#totalAPayer').text('0.00 CFA').removeClass('text-danger text-success');
        }
    }

    // Affichage du modal de visualisation d'échange
    function showExchangeModal() {
        const exchangeId = $(this).data('id');
        currentExchangeId = exchangeId;

        const tr = $(this).closest('tr');
        const row = $('#exchangesTable').DataTable().row(tr).data();


        populateExchangeModal(row);
        $('#viewExchangeModal').modal('show');
    }

    // Remplissage du modal d'échange
    function populateExchangeModal(exchange) {
        // Informations générales
        $('#exchangeDate').text(formatDate(exchange.date));
        $('#exchangeType').html(exchange.type === 'achat' ?
            '<span class="badge bg-info">Achat</span>' :
            '<span class="badge bg-warning text-dark">Vente</span>');
        $('#exchangeAgence').text(exchange.agence.name + ' (' + exchange.agence.devise + ')');

        // Client
        $('#exchangeClientName').text(exchange.client);
        $('#exchangeClientPhone').text(exchange.clientPhone);

        // Détails financiers
        $('#exchangeDevise').text(exchange.agence.devise);

        $('#exchangeRate').text('1 ' + exchange.agence.devise + ' = ' + parseFloat(exchange.taux).toFixed(4) + ' FCFA');

        const total = parseFloat(exchange.toAmount);
        $('#exchangeTotal').text((exchange.type === 'achat' ? '+' : '-') + formatMoney(total) + ' ' + exchange.agence.devise);
        $('#exchangeAmount').text((exchange.type === 'achat' ? '-' : '+') + formatMoney(parseFloat(exchange.fromAmount).toFixed(2)) + ' ' + "CFA");
        if (exchange.type === 'achat') {
            $('#exchangeAmount').removeClass('text-success').addClass('text-danger');
            $('#exchangeTotal').removeClass('text-danger').addClass('text-success');
        } else {
            $('#exchangeAmount').removeClass('text-danger').addClass('text-success');
            $('#exchangeTotal').removeClass('text-success').addClass('text-danger');
        }

        // Gestion des boutons d'action
        $('#validateExchangeBtn, #cancelExchangeBtn, #deleteExchangeBtn').addClass('d-none');
        $('#cancelExchangeBtn').removeClass('d-none');

        // Configuration des gestionnaires d'événements
        $('#cancelExchangeBtn').off('click').click(function () {
            $('#viewExchangeModal').modal('hide');
            confirmCancelExchange.call({ dataset: { id: exchange.id } });
        });

    }

    // Confirmation de validation d'échange
    function confirmValidateExchange() {
        currentExchangeId = $(this).data('id');
        $('#modalValidateExchange').modal('show');
    }

    // Validation d'échange
    function validateExchange() {
        $('#modalValidateExchange').modal('hide');

        // En production, envoyer la requête au serveur
        $.ajax({
            url: '/api/exchanges/' + currentExchangeId + '/validate',
            type: 'PUT',
            success: function () {
                showToastModal({
                    message: 'Échange validé avec succès',
                    type: 'success'
                });
                loadExchanges();
                
            },
            error: function (error) {
                showToastModal({
                    message: error.responseJSON?.message || 'Erreur lors de la validation',
                    type: 'error'
                });
            }
        });

        // Version simulée pour le frontend
        setTimeout(() => {
            showToastModal({
                message: 'Échange validé avec succès',
                type: 'success'
            });
            loadExchanges();
        }, 500);
    }

    // Confirmation d'annulation d'échange
    function confirmCancelExchange() {
        currentExchangeId = $(this).data('id');
        $('#cancelExchangeId').val(currentExchangeId);
        $('#modalCancelExchange').modal('show');
    }

    // Annulation d'échange
    function cancelExchange(e) {
        e.preventDefault();
        $('#modalCancelExchange').modal('hide');

        const reason = $('#form-cancel-exchange textarea').val();

        // En production, envoyer la requête au serveur
        $.ajax({
            url: '/api/exchanges/' + currentExchangeId,
            type: 'DELETE',
            data: { reason: reason },
            success: function () {
                showToastModal({
                    message: 'Échange annulé avec succès',
                    type: 'success'
                });
                $('#form-cancel-exchange')[0].reset();
                loadExchanges();
            },
            error: function (error) {
                showToastModal({
                    message: error.responseJSON?.message || 'Erreur lors de l\'annulation',
                    type: 'error'
                });
            }
        });


    }

    // Confirmation de suppression d'échange
    function confirmDeleteExchange() {
        currentExchangeId = $(this).data('id');
        $('#modalDeleteExchange').modal('show');
    }

    // Suppression d'échange
    function deleteExchange() {
        $('#modalDeleteExchange').modal('hide');

        // En production, envoyer la requête au serveur
        $.ajax({
            url: '/api/exchanges/' + currentExchangeId,
            type: 'DELETE',
            success: function () {
                showToastModal({
                    message: 'Échange supprimé avec succès',
                    type: 'success'
                });
                loadExchanges();
            },
            error: function (error) {
                showToastModal({
                    message: error.responseJSON?.message || 'Erreur lors de la suppression',
                    type: 'error'
                });
            }
        });


    }

    // Gestion du formulaire d'agence
    function handleAgenceSubmit(e) {
        e.preventDefault();
        const form = $(this);
        const submitBtn = form.find('[type="submit"]');
        const originalText = submitBtn.html();

        submitBtn.prop('disabled', true).html('<i class="bi bi-arrow-repeat spin me-2"></i>En cours...');

        // En production, envoyer les données au serveur
        const formData = form.serialize();
        $.post('/api/agences', formData, function (response) {
            showToastModal({
                message: 'Agence créée avec succès',
                type: 'success'
            });
            form.trigger('reset');
            $('#modalAddAgence').modal('hide');
            loadAgences();
        }).fail(function (error) {
            showToastModal({
                message: error.responseJSON?.message || 'Erreur lors de la création',
                type: 'error'
            });
        }).always(function () {
            submitBtn.prop('disabled', false).html(originalText);
        });


    }

    // Édition d'agence
    function editAgence() {
        $(document).on('click', '.edit-agence', function () {
            const agenceId = $(this).data('id');
            const rowData = agencesTable.row($(this).parents('tr')).data();

            // Remplir le modal avec les données de l'agence
            $('#edit-agence-id').val(agenceId);
            $('#edit-nom').val(rowData.nom);
            $('#edit-localite').val(rowData.localite);

            // Afficher le modal
            $('#modalEditAgence').modal('show');
        });

        // Soumission du formulaire d'édition
        $('#form-edit-agence').on('submit', function (e) {
            e.preventDefault();
            const id = $('#edit-agence-id').val();
            const formData = {
                name: $('#edit-nom').val(),
                localite: $('#edit-localite').val()
            };

            $.ajax({
                url: `/api/agences/${id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(formData),
                success: function (response) {
                    // Mettre à jour la ligne dans le tableau
                    loadAgences();
                    $('#modalEditAgence').modal('hide');
                    // Optionnel : afficher un message de succès
                    showToastModal({
                        message: 'Agence mise à jour avec succès',
                        type: 'success'
                    });
                },
                error: function (xhr) {
                    const errors = xhr.responseJSON?.errors;
                    if (errors) {
                        alert('Erreur : ' + errors.join('\n'));
                    } else {
                        showToastModal({
                            message: 'Erreur lors de la mise à jour', type: 'error'
                        });
                    }
                }
            });
        });
    }

    // Confirmation de désactivation d'agence
    function confirmDesactivateAgence() {
        currentExchangeId = $(this).data('id');
        $('#modalDesactivateAgence').modal('show');
    }

    // Désactivation d'agence
    function desactivateAgence() {
        $('#modalDesactivateAgence').modal('hide');

        // En production, envoyer la requête au serveur
        $.ajax({
            url: '/api/agences/' + currentExchangeId + '/desactivate',
            type: 'PUT',
            success: function () {
                showToastModal({
                    message: 'Agence désactivée avec succès',
                    type: 'success'
                });
                loadAgences();
            },
            error: function (error) {
                showToastModal({
                    message: error.responseJSON?.message || 'Erreur lors de la désactivation',
                    type: 'error'
                });
            }
        });


    }

    // Confirmation d'activation d'agence
    function confirmActivateAgence() {
        currentExchangeId = $(this).data('id');
        $('#modalActivateAgence').modal('show');
    }

    // Activation d'agence
    function activateAgence() {
        $('#modalActivateAgence').modal('hide');

        // En production, envoyer la requête au serveur
        $.ajax({
            url: '/api/agences/' + currentExchangeId + '/activate',
            type: 'PUT',
            success: function () {
                showToastModal({
                    message: 'Agence activée avec succès',
                    type: 'success'
                });
                loadAgences();
            },
            error: function (error) {
                showToastModal({
                    message: error.responseJSON?.message || 'Erreur lors de l\'activation',
                    type: 'error'
                });
            }
        });

    }

    // Impression de reçu
    function printReceipt() {
        currentExchangeId = $(this).data('id');

        if (!currentExchangeId) {
            showToastModal({
                message: 'Aucun échange sélectionné pour l\'impression',
                type: 'error'
            });
            return;
        }

        // Ouvrir une nouvelle fenêtre pour l'impression
        const printWindow = window.open('/api/exchanges/' + currentExchangeId + '/print', '_blank');
        printWindow.focus();
    }

    // Helper: Formatage de date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    // Helper: Formatage d'argent
    function formatMoney(amount) {
        return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
    }

    // Initialisation de l'application
    initComponents();
});