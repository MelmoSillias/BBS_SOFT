$(document).ready(function () {
    // Variables globales
    let agences = []; // Liste des agences
    let currentExchangeId = null; // ID de l'échange en cours de traitement
    let exchangesTable
    const $agence = $('#agence');
    const $typeOps = $('#typeOps');
    const $deviseExchange = $('#deviseExchange');
    const $montant = $('#montant');
    const $taux = $('#taux');
    const $deviseAgenceDisplay = $('#deviseAgenceDisplay');
    const $devise = $('#devise');
    const $totalAPayer = $('#totalAPayer');
    const $form = $('#form-add-exchange');
    const $dateOps = $('#dateOps');

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

        initExchangesTable();
        // updateStats();

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
                    title: 'Liste des exchanges',
                    exportOptions: { columns: [0, 1, 2, 3, 4, 5] }
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                    className: 'btn btn-danger',
                    titleAttr: 'Exporter vers PDF',
                    title: 'Liste des exchanges',
                    exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
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
                },
                dataSrc: 'data'
            },
            columns: [
                {
                    "data": "date",  
                },
                {
                    "data": "type",
                    "render": function (data, type, row) {
                        const color = data === 'achat' ? 'bg-info' : 'bg-warning';
                        return `<span class="badge ${color}">${data}</span>`;
                    }
                },
                {
                    "data": "description",
                    "render": function (data, type, row) {
                        // Afficher le type d'opération (achat/vente)
                        return data;
                    }
                }, 
                {
                    data: 'null',
                    render: function (data, type, row) {
                        // Afficher le montant de la devise avec couleur en fonction du type
                        const color = row.type === 'achat' ? 'text-success' : 'text-danger';
                        const sign = row.type === 'achat' ? '+' : '-';
                        return `<span class="${color}  fw-bold">${sign}${row.montantDevise} ${row.devise}</span>`;
                    }
                },
                {
                    "data": null,
                    "render": function (data, type, row) {
                        // Afficher le montant en CFA
                        const color = row.type === 'achat' ? 'text-danger' : 'text-success';
                        const sign = row.type === 'achat' ? '-' : '+';
                        return `<span class="${color} fw-bold">${sign}${row.montantCFA} CFA</span>`;
                    }
                },
                {
                    "data": "taux",
                    "render": function (data, type, row) {
                        // Formater le taux
                        return parseFloat(data).toFixed(4);
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

    // Chargement des échanges
    function loadExchanges() {
        exchangesTable.ajax.reload();
        // updateStats()
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

        // Actions sur les échanges
        $(document).on('click', '.view-exchange', showExchangeModal);
        $(document).on('click', '.print-exchange', printReceipt);
        $(document).on('click', '.cancel-exchange', confirmDeleteExchange);
        
        $('#confirmDelete').click(deleteExchange);

        // Impression
        $('#printReceiptBtn').click(printReceipt);
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
        $('#exchangeDescription').text(exchange.description || 'N/A');
 
        // Détails financiers
        $('#exchangeDevise').text(exchange.montantDevise + ' ' + exchange.devise);

        $('#exchangeRate').text(parseFloat(exchange.taux).toFixed(2) + ' FCFA');
 
        $('#exchangeAmount').text((exchange.type === 'achat' ? '-' : '+') + formatMoney(parseFloat(exchange.montantCFA).toFixed(2)) + ' ' + "CFA");
        if (exchange.type === 'achat') {
            $('#exchangeAmount').removeClass('text-success').addClass('text-danger'); 
        } else {
            $('#exchangeAmount').removeClass('text-danger').addClass('text-success'); 
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

    // Fonction pour mettre à jour l'interface en fonction de l'agence sélectionnée
    function updateUIByAgency() {
        const selectedAgencyId = parseInt($agence.val());

        if (selectedAgencyId === 1) {
            // Agence d'id 1: tous les choix sont disponibles
            $typeOps.prop('disabled', false).prop('readonly', false);
            $deviseExchange.prop('disabled', false).prop('readonly', false);
        } else {
            // Autres agences: seulement achat et USD
            $typeOps.val('achat').prop('disabled', true).prop('readonly', true);
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
            $devise.text(selectedDevise);
        } else {
            $devise.text(selectedDevise);
        }
    }

    // Fonction pour calculer le total
    function calculateTotal() {
        const montant = parseFloat($montant.val()) || 0;
        const taux = parseFloat($taux.val()) || 0;
        const type = $typeOps.val();

        let total = 0;

        if (type === 'achat') {
            // Pour l'achat: montant en devise * taux = montant en CFA (négatif)
            total = montant * taux;
            $totalAPayer.removeClass('text-success text-danger').addClass('text-danger');
            $totalAPayer.text(`-${total.toFixed(2)} CFA`);
        } else {
            // Pour la vente: montant en devise * taux = montant en CFA (positif)
            total = montant * taux;
            $totalAPayer.removeClass('text-success text-danger').addClass('text-success');
            $totalAPayer.text(`+${total.toFixed(2)} CFA`);
        }
    }

    // Événement lors du changement d'agence
    $agence.on('change', function () {
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

    // Événement pour la réinitialisation du formulaire
    $('#resetForm').on('click', function () {
        // Réinitialiser la date à aujourd'hui
        $dateOps.val(today);

        // Laisser un petit délai pour que la réinitialisation s'applique
        setTimeout(function () {
            updateUIByAgency();
            calculateTotal();
        }, 100);
    });

    // Événement pour la soumission du formulaire
    $form.on('submit', function (e) {
        e.preventDefault();

        // Validation des champs obligatoires
        if (!$agence.val()) {
            showToastModal({ message: 'Veuillez sélectionner une agence.', type: 'error' });
            return;
        }

        if (!$montant.val() || parseFloat($montant.val()) <= 0) {
            showToastModal({ message: 'Veuillez saisir un montant valide.', type: 'error' });
            return;
        }

        if (!$taux.val() || parseFloat($taux.val()) <= 0) {
            showToastModal({ message: 'Veuillez saisir un taux valide.', type: 'error' });
            return;
        }
        // Récupération des données du formulaire
        const formData = {
            agence: $agence.val(),
            description: $('#description').val(),
            date: $dateOps.val(),
            type: $typeOps.val(),
            deviseExchange: $deviseExchange.val(),
            montant: $montant.val(),
            taux: $taux.val(),
        };

        // Envoi des données au serveur
        $.ajax({
            url: '/api/exchanges', // URL à adapter selon votre API
            method: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            success: function (response) {
                showToastModal({ message: 'Échange créé avec succès!', type: 'success' });

                // Réinitialiser le formulaire
                $form[0].reset();
                $dateOps.val(new Date());

                // Mettre à jour l'interface
                updateUIByAgency();
                calculateTotal();

                // Recharger la table des échanges si elle existe
                if (typeof exchangesTable !== 'undefined' && exchangesTable) {
                    exchangesTable.ajax.reload();
                }
            },
            error: function (xhr) {
                showToastModal({ message: 'Erreur lors de la création de l\'échange: ', type: "error" });
            }
        });
    });

    // Initialisation de l'interface au chargement
    updateUIByAgency();
    calculateTotal();

    // Initialisation de l'application
    initComponents();
});