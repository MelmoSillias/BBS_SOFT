$(document).ready(function () {
    let currentExpenseData = null;
    let expenseId;
    let startExpenseDate;
    let endExpenseDate;
    
    // Initialiser le sélecteur de période
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

    // Mettre à jour les champs avec les dates sélectionnées
    $('#filterDateRange').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startExpenseDate = picker.startDate.format('YYYY-MM-DD');
        endExpenseDate = picker.endDate.format('YYYY-MM-DD');

        // Recharger la table avec les nouvelles dates
        tableExpenses.ajax.reload();
        chargerStatsDepenses();
    });

    $('#filterDateRange').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startExpenseDate = null;
        endExpenseDate = null;

        // Recharger la table avec les dates effacées
        tableExpenses.ajax.reload();
        chargerStatsDepenses();
    });

    // Initialiser DataTable pour les dépenses
    const tableExpenses = $('#expensesTable').DataTable({
        ajax: {
            url: '/api/depenses',
            dataSrc: '',
            data: function (d) {
                // Ajout des paramètres de filtre à la requête
                d.type = $('#filterType').val();
                d.dateFrom = startExpenseDate;
                d.dateTo = endExpenseDate;
            }
        },
        columns: [
            {
                data: 'date',
                render: function (data) {
                    return new Date(data).toLocaleDateString('fr-FR');
                }
            },
            {
                data: 'motif'
            },
            {
                data: 'type',
                 
            },
            {
                data: 'montant',
                render: function (data) {
                    return `<span class="text-danger fw-bold">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end'
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-primary dropdown-toggle btn-table-action" type="button" data-bs-toggle="dropdown">
                                <i class="bi bi-gear"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item print-expense" href="#" data-id="${row.id}"> <i class="bi bi-printer me-2"></i>Imprimer </a></li>
                                <li><a class="dropdown-item view-expense" href="#" data-id="${row.id}"><i class="bi bi-eye me-2"></i>Voir</a></li>
                                <li><a class="dropdown-item edit-expense" href="#" data-id="${row.id}"><i class="bi bi-pencil me-2"></i>Modifier</a></li>
                                <li><a class="dropdown-item delete-expense" href="#" data-id="${row.id}"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                            </ul>
                        </div>
                    `;
                }, 
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
                title: 'Liste des dépenses',
                exportOptions: {
                    columns: [0, 1, 2, 3],
                    format: {
                        body: function (data, row, column, node) {
                            // Nettoyer le contenu HTML pour Excel
                            if (column === 2) { // Type
                                return $(data).text() || data;
                            }
                            if (column === 3) { // Montant
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            return data;
                        }
                    }
                },
                customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];
                    $('row:first c', sheet).attr('s', '2');
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Liste des dépenses',
                exportOptions: {
                    columns: [0, 1, 2, 3],
                    format: {
                        body: function (data, row, column, node) {
                            // Nettoyer le contenu HTML pour PDF
                            if (column === 2) { // Type
                                return $(data).text() || data;
                            }
                            if (column === 3) { // Montant
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            return data;
                        }
                    }
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['*', '*', '*', '*'];
                    doc.styles.tableHeader.fillColor = '#007bff';
                    doc.styles.tableHeader.color = '#ffffff';
                    doc.styles.tableHeader.alignment = 'center';

                    doc.content[1].table.body.forEach(function (row, i) {
                        if (i > 0) {
                            row[3].alignment = 'right';
                        }
                    });

                    for (var i = 1; i < doc.content[1].table.body.length; i++) {
                        doc.content[1].table.body[i][3] = { text: doc.content[1].table.body[i][3] + ' F CFA', alignment: 'right' };
                    }
                }
            }
        ],
        language: {
            url: '/api/datatable_json_fr'
        },
        initComplete: function () {
            // Ajout des filtres personnalisés
            $('#expensesTable_filter').prepend(`
                <div class="btn-group ms-2">
                    <select id="filterType" class="form-select form-select-sm">
                        <option value="">Tous types</option>
                        <option value="fournitures">Fournitures de bureau</option>
                        <option value="loyer">Loyer</option>
                        <option value="salaires">Salaires et charges</option>
                        <option value="entretien">Entretien et réparation</option>
                        <option value="transport">Transport et déplacement</option>
                        <option value="communication">Communication</option>
                        <option value="formation">Formation</option>
                        <option value="autres">Autres dépenses</option>
                    </select>
                </div>
            `);

            // Écouteurs d'événements pour les filtres
            $('#filterType, #filterDateRange').on('change', function () {
                tableExpenses.ajax.reload();
                chargerStatsDepenses();
            });
        }
    });

    // Initialiser la date avec la date du jour
    $('#dateExpense').val(new Date().toISOString().split('T')[0]);

    // Soumission du formulaire d'ajout de dépense
    $('#form-add-expense').submit(function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn);

        // Préparation des données
        const formData = {
            date: $('#dateExpense').val() ? moment($('#dateExpense').val()).format('YYYY-MM-DD') : null,
            type: $('#typeExpense').val(), 
            motif: $('#motifExpense').val(),
            montant: $('#montantExpense').val(), 
            notes: $('#notesExpense').val()
        };

        // Envoi des données via AJAX
        $.ajax({
            url: '/api/depense/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Dépense enregistrée avec succès', type: 'success' });
                // Réinitialisation du formulaire
                $('#form-add-expense').trigger("reset");
                $('#dateExpense').val(new Date().toISOString().split('T')[0]);
                tableExpenses.ajax.reload();
                chargerStatsDepenses();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Ouvrir le modal de visualisation des détails
    function openViewExpenseModal(expenseId) {
        $.get('/api/depenses/' + expenseId, function (data) {
            currentExpenseData = data;

            // Remplir les informations dans le modal
            $('#viewDate').text(new Date(data.date).toLocaleDateString('fr-FR'));
            $('#viewMotif').text(data.motif);
            
            // Afficher le type avec le badge approprié
            let typeBadge = '';
            switch (data.type) {
                case 'operationnel':
                    typeBadge = '<span class="badge badge-operation">Opérationnel</span>';
                    break;
                case 'administratif':
                    typeBadge = '<span class="badge badge-administratif">Administratif</span>';
                    break;
                case 'divers':
                    typeBadge = '<span class="badge badge-divers">Divers</span>';
                    break;
                default:
                    typeBadge = data.type;
            }
            $('#viewType').html(typeBadge);
             
            $('#viewMontant').text(parseFloat(data.montant).toLocaleString('fr-FR') + ' F CFA'); 
            $('#viewNotes').text(data.notes || 'Aucune note');

            // Afficher le modal
            $('#modalViewExpense').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Ouvrir le modal de modification
    function openEditExpenseModal(expenseId) {
        $.get('/api/depenses/' + expenseId, function (data) {
            // Remplir le formulaire de modification
            $('#editExpenseId').val(data.id);
            $('[name="date"]', '#form-edit-expense').val(data.date.split('T')[0]);
            $('[name="motif"]', '#form-edit-expense').val(data.motif);
            $('[name="type"]', '#form-edit-expense').val(data.type);
            $('[name="montant"]', '#form-edit-expense').val(data.montant);

            // Afficher le modal
            $('#modalEditExpense').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Soumission du formulaire de modification
    $('#form-edit-expense').submit(function (e) {
        e.preventDefault();

        const $btn = $(this).find('button[type="submit"]');
        disableButton($btn);

        const formData = {
            id: $('#editExpenseId').val(),
            date: $('[name="date"]', this).val(),
            motif: $('[name="motif"]', this).val(),
            type: $('[name="type"]', this).val(),
            montant: $('[name="montant"]', this).val()
        };

        $.ajax({
            url: '/api/depenses/' + formData.id + '/update',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Dépense modifiée avec succès', type: 'success' });
                $('#modalEditExpense').modal('hide');
                tableExpenses.ajax.reload();
                chargerStatsDepenses();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Soumission du formulaire de suppression
    $('#form-delete-expense').submit(function (e) {
        e.preventDefault();

        const $btn = $(this).find('button[type="submit"]');
        disableButton($btn);

        const expenseId = $('#deleteExpenseId').val();
        const raison = $('[name="raison"]', this).val();

        $.ajax({
            url: '/api/depenses/' + expenseId + '/delete',
            type: 'DELETE',
            data: JSON.stringify({ raison: raison }),
            contentType: 'application/json',
            success: function (response) {
                showToastModal({ message: 'Dépense supprimée avec succès', type: 'success' });
                $('#modalDeleteExpense').modal('hide');
                tableExpenses.ajax.reload();
                chargerStatsDepenses();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Écouteurs pour les actions de la table
    $('#expensesTable').on('click', '.view-expense', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openViewExpenseModal(id);
    });

    $('#expensesTable').on('click', '.edit-expense', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openEditExpenseModal(id);
    });

    $('#expensesTable').on('click', '.delete-expense', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        $('#deleteExpenseId').val(id);
        $('#modalDeleteExpense').modal('show');
    });

    $('#expensesTable').on('click', '.print-expense', function (e) { 
        e.preventDefault();
        const id = $(this).data('id'); 
        window.open(`/api/depenses/${id}/print`, "_blank")
    });

    // Fonction pour charger les statistiques des dépenses
    function chargerStatsDepenses() {
        $.ajax({
            url: '/api/depenses/stats',
            method: 'GET',
            data: {
                type: $('#filterType').val(),
                dateFrom: startExpenseDate,
                dateTo: endExpenseDate
            },
            dataType: 'json',
            success: function (data) {
                $('#stat-total').text(formatMontant(data.montant_total || 0));
                $('#stat-operationnel').text(formatMontant(data.par_type?.operationnel || 0));
                $('#stat-administratif').text(formatMontant(data.par_type?.administratif || 0));
                $('#stat-divers').text(formatMontant(data.par_type?.divers || 0));
            },
            error: function (xhr, status, error) {
                console.error('Erreur chargement statistiques:', error);
                showToastModal({ message: 'Erreur lors du chargement des statistiques', type: 'error' });
            }
        });
    }

    // Fonction pour formater les montants
    function formatMontant(valeur) {
        return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
    }

    // Fonction pour prévenir les doubles envois
    function disableButton(button) {
        button.prop('disabled', true);
        setTimeout(() => {
            button.prop('disabled', false);
        }, 3000);
    }

    // Actualiser la table
    $('#refreshTable').on('click', function () {
        tableExpenses.ajax.reload();
        chargerStatsDepenses();
    });

    // Initialiser les statistiques au chargement
    chargerStatsDepenses();
});