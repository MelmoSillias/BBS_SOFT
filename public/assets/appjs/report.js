$(document).ready(function () {
    // Initialisation du date range picker
    const startDate = moment().startOf('day');
    const endDate = moment().endOf('day');

    $('#dateRange').daterangepicker({
        locale: {
            format: 'DD/MM/YYYY',
            applyLabel: 'Appliquer',
            cancelLabel: 'Annuler',
            daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            firstDay: 1
        },
        startDate: startDate,
        endDate: endDate,
        opens: 'right',
        ranges: {
            "Aujourd'hui": [moment().startOf('day'), moment().endOf('day')],
            'Hier': [moment().subtract(1, 'days').startOf('day'), moment().subtract(1, 'days').endOf('day')],
            '7 derniers jours': [moment().subtract(6, 'days').startOf('day'), moment().endOf('day')],
            '30 derniers jours': [moment().subtract(29, 'days').startOf('day'), moment().endOf('day')],
            'Ce mois': [moment().startOf('month'), moment().endOf('month')],
            'Mois dernier': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        }
    });

    // Initialisation de DataTable
    const table = $('#transactionsTable').DataTable({
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="bi bi-file-earmark-excel me-2"></i>Excel',
                className: 'btn-export-excel',
                title: 'Rapport Transactions',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5]
                }
            },
            {
                extend: 'pdf',
                text: '<i class="bi bi-file-earmark-pdf me-2"></i>PDF',
                className: 'btn-export-pdf',
                title: 'Rapport Transactions',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5]
                },
                customize: function (doc) {
                    doc.content[1].table.widths = ['5%', '35%', '15%', '15%', '15%', '15%'];
                    doc.styles.tableHeader.fillColor = '#3a7bd5';
                    doc.styles.tableHeader.color = 'white';
                }
            }
        ],
        language: {
            url: '/api/datatable_json_fr'
        },
        columnDefs: [
            { targets: 0, width: '5%' },
            { targets: 1, width: '35%' },
            { targets: 2, width: '15%' },
            { targets: [3, 4, 5], width: '15%', className: 'text-end' }
        ],
        order: [[2, 'desc']],
        paging: false,
        searching: false,
        info: false
    });

    // Gestion de l'export Excel personnalisé
    $('#exportExcel').click(function () {
        table.button('.buttons-excel').trigger();
    });

    // Gestion de l'export PDF personnalisé
    $('#exportPDF').click(function () {
        table.button('.buttons-pdf').trigger();
    });

    // Chargement des détails de l'agence
    $('#agenceSelect').change(function () {
        const agenceId = $(this).val();

        if (!agenceId) {
            $('#agenceDetails').html(`
                        <div class="text-center py-4">
                            <i class="bi bi-building text-muted" style="font-size: 3rem;"></i>
                            <p class="mt-2 text-muted">Sélectionnez une agence</p>
                        </div>
                    `);
            return;
        }
        // Version simulée pour le frontend
        const agence = agences.find(a => a.id == agenceId);

        displayAgenceDetails(agence);
    });

    // Fonction pour afficher les détails de l'agence
    function displayAgenceDetails(agence) {
        const activeBadge = agence.isActive ?
            '<span class="badge bg-success">Active</span>' :
            '<span class="badge bg-secondary">Inactive</span>';

        const createdAt = agence.createdAt;

        $('#agenceDetails').html(`
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="mb-1">${agence.nom}</h5>
                            <p class="text-muted mb-1">
                                <i class="bi bi-geo-alt me-2"></i>${agence.localite}
                            </p>
                        </div>
                        ${activeBadge}
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-6">
                            <p class="mb-1"><strong>Devise:</strong></p>
                            <p>${agence.devise}</p>
                        </div>
                        <div class="col-6">
                            <p class="mb-1"><strong>Créée le:</strong></p>
                            <p>${createdAt}</p>
                        </div>
                    </div>
                `);
    }

    // Chargement des transactions
    $('#filterBtn').click(loadTransactions);

    // Charger les transactions par défaut pour l'agence Bamako CFA
    if ($('#agenceSelect').val()) {
        $('#agenceSelect').trigger('change');
        loadTransactions();
    }

    function loadTransactions() {
        const agenceId = $('#agenceSelect').val();
        const dateRange = $('#dateRange').val();

        if (!agenceId) {
            showToast('Veuillez sélectionner une agence', 'warning');
            return;
        }

        const dates = dateRange ? dateRange.split(' - ') : [];
        const startDate = dates[0] || '';
        const endDate = dates[1] || '';

        $.get(`/api/report/agence/${agenceId}`, {
            startDate: startDate,
            endDate: endDate
        }, function (response) {
            populateTransactionsTable(response.data, response.initial);

            let sommeEntrees = 0;
                for (let i = 0; i < response.data.length; i++) {
                    sommeEntrees += response.data[i].entree;
                }

                let sommeSorties = 0;
                for (let i = 0; i < response.data.length; i++) {
                    sommeSorties += response.data[i].sortie;
                }



            updateTotals({
                entree: sommeEntrees,
                sortie: sommeSorties,
                solde: sommeEntrees - sommeSorties
            });

        });
    }

    function populateTransactionsTable(transactions, initialBalance) {
        table.clear();

        let currentDate = null;

        transactions.forEach((tx, index) => {
            const txDate = new Date(tx.date).toLocaleDateString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });

            if (currentDate !== txDate) {
                // Ajouter une ligne d'entête pour cette date
                const startOfDay = transactions.find(t => new Date(t.date).toLocaleDateString('fr-FR') === txDate);
                const endOfDay = [...transactions].reverse().find(t => new Date(t.date).toLocaleDateString('fr-FR') === txDate);

                table.row.add([
                    '', 
                    `<span class="solde" >Début: ${formatMoney(startOfDay.solde - (startOfDay.entree - startOfDay.sortie))} FCFA | Fin: ${formatMoney(endOfDay.solde)} FCFA</span>`,
                    '',
                    '',
                    '',
                    `<strong>${txDate}</strong>`,
                ]);

                currentDate = txDate;
            }

            const dateTime = new Date(tx.date).toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            table.row.add([
                index + 1,
                tx.description,
                dateTime,
                tx.entree ? `<span class="entree">${formatMoney(tx.entree)} ${tx.devise}</span>` : '-',
                tx.sortie ? `<span class="sortie">${formatMoney(tx.sortie)} ${tx.devise}</span>` : '-',
                `<span class="solde">${formatMoney(tx.solde)} ${tx.devise}</span>`
            ]);
        });

        table.draw();
    }


    // Helper: Formatage d'argent
    function formatMoney(amount) {
        amount = parseFloat(amount)
        if (amount) return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
        else return 0;
    }

    function updateTotals(totals) {
        $('#totalEntree').html(`<span class="entree">${formatMoney(totals.entree)} FCFA</span>`);
        $('#totalSortie').html(`<span class="sortie">${formatMoney(totals.sortie)} FCFA</span>`);
        $('#totalSolde').html(`<span class="solde">${formatMoney(totals.solde)} FCFA</span>`);
    }

    // Helper: Affichage de notification
    function showToast(message, type = 'success') {
        const toast = $(`
                    <div class="toast align-items-center text-white bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">
                                ${message}
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                `);

        $('#toastContainer').append(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
});