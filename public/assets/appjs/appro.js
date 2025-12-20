$(document).ready(function () {
    let currentApproData = null;
    let startApproDate;
    let endApproDate;

    // Initialiser le sélecteur de période pour les approvisionnements
    $('#filterDateRangeAppro').daterangepicker({
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
    $('#filterDateRangeAppro').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startApproDate = picker.startDate.format('YYYY-MM-DD');
        endApproDate = picker.endDate.format('YYYY-MM-DD');
        // Recharger la table avec les nouvelles dates
        tableAppro.ajax.reload();
        chargerStatsAppro();
    });

    $('#filterDateRangeAppro').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startApproDate = null;
        endApproDate = null;
        // Recharger la table avec les dates effacées
        tableAppro.ajax.reload();
        chargerStatsAppro();
    });

    // Initialiser DataTable pour les approvisionnements
    const tableAppro = $('#approvisionnementTable').DataTable({
        ajax: {
            url: '/api/approvisionnements',
            dataSrc: '',
            data: function (d) {
                // Ajout des paramètres de filtre à la requête
                d.type = $('#filterTypeAppro').val();
                d.dateFrom = startApproDate;
                d.dateTo = endApproDate;
            }
        },
        columns: [
            { 
                data: 'id', visible : false
            },
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
                    return `<span class="text-success fw-bold">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end'
            },
            {
                data: null,
                render: function (data, type, row) {
                    return `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-success dropdown-toggle btn-table-action" type="button" data-bs-toggle="dropdown">
                                <i class="bi bi-gear"></i>
                            </button>
                            
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item print-appro" href="#" data-id="${row.id}"> <i class="bi bi-printer me-2"></i>Imprimer</a></li>
                                <li><a class="dropdown-item view-appro" href="#" data-id="${row.id}"><i class="bi bi-eye me-2"></i>Voir</a></li>
                                <li><a class="dropdown-item edit-appro" href="#" data-id="${row.id}"><i class="bi bi-pencil me-2"></i>Modifier</a></li>
                                <li><a class="dropdown-item delete-appro" href="#" data-id="${row.id}"><i class="bi bi-trash me-2"></i>Supprimer</a></li>
                            </ul>
                        </div>
                    `;
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
                title: 'Liste des approvisionnements',
                exportOptions: {
                    columns: [0, 1, 2, 3],
                    format: {
                        body: function (data, row, column, node) {
                            if (column === 2) {
                                return $(data).text() || data;
                            }
                            if (column === 3) {
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            return data;
                        }
                    }
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Liste des approvisionnements',
                exportOptions: {
                    columns: [0, 1, 2, 3],
                    format: {
                        body: function (data, row, column, node) {
                            if (column === 2) {
                                return $(data).text() || data;
                            }
                            if (column === 3) {
                                return data.replace(' F CFA', '').replace(/\s/g, '');
                            }
                            return data;
                        }
                    }
                }
            }
        ],
        language: {
            url: '/api/datatable_json_fr'
        },
        initComplete: function () {
            // Écouteurs d'événements pour les filtres
            $('#filterTypeAppro, #filterDateRangeAppro').on('change', function () {
                tableAppro.ajax.reload();
                chargerStatsAppro();
            });
        }
    });

    // Initialiser la date avec la date du jour
    $('#dateAppro').val(new Date().toISOString().split('T')[0]);

    // Soumission du formulaire d'ajout d'approvisionnement
    $('#form-add-appro').submit(function (e) {
        e.preventDefault();
        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn);

        const formData = {
            date: $('#dateAppro').val() ? moment($('#dateAppro').val()).format('YYYY-MM-DD') : null,
            type: $('#typeAppro').val(),
            motif: $('#motifAppro').val(),
            montant: $('#montantAppro').val(),
            notes: $('#notesAppro').val()
        };

        $.ajax({
            url: '/api/approvisionnement/create',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Approvisionnement enregistré avec succès', type: 'success' });
                $('#form-add-appro').trigger("reset");
                $('#dateAppro').val(new Date().toISOString().split('T')[0]);
                tableAppro.ajax.reload();
                chargerStatsAppro();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Ouvrir le modal de visualisation des détails
    function openViewApproModal(approId) {
        $.get('/api/approvisionnements/' + approId, function (data) {
            currentApproData = data;
            $('#viewDateAppro').text(new Date(data.date).toLocaleDateString('fr-FR'));
            $('#viewMotifAppro').text(data.motif);
            $('#viewTypeAppro').text(data.type);
            $('#viewMontantAppro').text(parseFloat(data.montant).toLocaleString('fr-FR') + ' F CFA');
            $('#viewNotesAppro').text(data.notes || 'Aucune note');
            $('#modalViewAppro').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Ouvrir le modal de modification
    function openEditApproModal(approId) {
        $.get('/api/approvisionnements/' + approId, function (data) {
            $('#editApproId').val(data.id);
            $('[name="date"]', '#form-edit-appro').val(data.date.split('T')[0]);
            $('[name="motif"]', '#form-edit-appro').val(data.motif);
            $('[name="type"]', '#form-edit-appro').val(data.type);
            $('[name="montant"]', '#form-edit-appro').val(data.montant);
            $('#modalEditAppro').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Soumission du formulaire de modification
    $('#form-edit-appro').submit(function (e) {
        e.preventDefault();
        const $btn = $(this).find('button[type="submit"]');
        disableButton($btn);

        const formData = {
            id: $('#editApproId').val(),
            date: $('[name="date"]', this).val(),
            motif: $('[name="motif"]', this).val(),
            type: $('[name="type"]', this).val(),
            montant: $('[name="montant"]', this).val()
        };

        $.ajax({
            url: '/api/approvisionnements/' + formData.id + '/update',
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Approvisionnement modifié avec succès', type: 'success' });
                $('#modalEditAppro').modal('hide');
                tableAppro.ajax.reload();
                chargerStatsAppro();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Soumission du formulaire de suppression
    $('#form-delete-appro').submit(function (e) {
        e.preventDefault();
        const $btn = $(this).find('button[type="submit"]');
        disableButton($btn);

        const approId = $('#deleteApproId').val();
        const raison = $('[name="raison"]', this).val();

        $.ajax({
            url: '/api/approvisionnements/' + approId + '/delete',
            type: 'DELETE',
            data: JSON.stringify({ raison: raison }),
            contentType: 'application/json',
            success: function (response) {
                showToastModal({ message: 'Approvisionnement supprimé avec succès', type: 'success' });
                $('#modalDeleteAppro').modal('hide');
                tableAppro.ajax.reload();
                chargerStatsAppro();
            },
            error: function (xhr, status, error) {
                const errorMessage = xhr.responseJSON && xhr.responseJSON.message ? xhr.responseJSON.message : "Erreur de connexion";
                showToastModal({ message: errorMessage, type: 'error' });
            }
        });
    });

    // Écouteurs pour les actions de la table
    $('#approvisionnementTable').on('click', '.view-appro', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openViewApproModal(id);
    });

    $('#approvisionnementTable').on('click', '.edit-appro', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openEditApproModal(id);
    });

    $('#approvisionnementTable').on('click', '.delete-appro', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        $('#deleteApproId').val(id);
        $('#modalDeleteAppro').modal('show');
    });

    $('#approvisionnementTable').on('click', '.print-appro', function (e) {
        e.preventDefault();
        const id = $(this).data('id'); 
        window.open(`/api/appro/${id}/print`, "_blank")
    });

    // Fonction pour charger les statistiques des approvisionnements
    function chargerStatsAppro() {
        $.ajax({
            url: '/api/approvisionnements/stats',
            method: 'GET',
            data: {
                type: $('#filterTypeAppro').val(),
                dateFrom: startApproDate,
                dateTo: endApproDate
            },
            dataType: 'json',
            success: function (data) {
                $('#stat-total-appro').text(formatMontant(data.montant_total || 0));
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
    $('#refreshTableAppro').on('click', function () {
        tableAppro.ajax.reload();
        chargerStatsAppro();
    });

    // Initialiser les statistiques au chargement
    chargerStatsAppro();
});
