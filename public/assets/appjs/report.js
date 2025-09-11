$(document).ready(function () {
    // Initialisation du date range picker
    const startDate = moment().startOf('day');
    const endDate = moment().endOf('day');
    let count = 0;

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

    const table = $('#transactionsTable').DataTable({
        dom: 'Bfrtip',
        ajax: {
            url: '/api/report',
            dataSrc: '',
            data: function (d) {
                const dateRange = $('#dateRange').data('daterangepicker');
                count = 0
                d.startDate = dateRange.startDate.format('YYYY-MM-DD');
                d.endDate = dateRange.endDate.format('YYYY-MM-DD');
                d.agenceId = $('#agenceSelect').val();
                d.devise = $('#deviseSelect').val();
            },
        },
        columns: [
            { data: 'id', orderable: false },
            { data: 'description', orderable: false },
            { data: 'date', orderable: false },
            {
                data: 'entree', render: function (data) {
                    return data > 0 ? `<span class="text-success fw-bold">${formatMoney(data)}  ${$('#deviseSelect').val()}</span>` : '--';
                }, orderable: false
            },
            {
                data: 'sortie', render: function (data) {
                    return data > 0 ? `<span class="text-danger fw-bold">${formatMoney(data)}  ${$('#deviseSelect').val()}</span>` : '--';
                }, orderable: false
            },
            {
                data: 'solde', render: function (data) {
                    return `<span class="fw-bold text-white bg-secondary px-2 py-1 rounded">${formatMoney(data)}  ${$('#deviseSelect').val()}</span>`;
                }, orderable: false
            }
        ],
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="bi bi-file-earmark-excel me-2"></i>Excel',
                className: 'btn-export-excel',
                title: `Rapport Transactions ${$('#agenceSelect').text()}`,
                exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
                customizeData: function (data) {
                    let grouped = {};
                    data.body.forEach(row => {
                        const date = row[2];
                        if (!grouped[date]) grouped[date] = [];
                        grouped[date].push(row);
                    });

                    let newBody = [];
                    Object.keys(grouped).forEach(date => {
                        const rows = grouped[date];
                        // Récupérer la ligne brute (depuis le DataTable pour accéder à "initial")
                        const rawRow = table.rows((idx, d) => d.date === date).data()[0];
                        const soldeDepart = rawRow.initial; // solde de départ issu de l’API
                        const soldeFin = rows[0][5].text || rows[0][5];

                        newBody.push([
                            `📅 ${date} | Solde départ: ${soldeDepart} | Solde fin: ${soldeFin}`, '', '', '', '', ''
                        ]);
                        rows.forEach(r => newBody.push(r));
                    });
                    data.body = newBody;
                }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf me-2"></i>PDF',
                className: 'btn-export-pdf',
                title: 'Rapport Transactions',
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
                customize: function (doc) {
                    let grouped = {};
                    doc.content[1].table.body.forEach((row, idx) => {
                        if (idx === 0) return; // skip header
                        const date = row[2].text || row[2];
                        if (!grouped[date]) grouped[date] = [];
                        grouped[date].push(row);
                    });

                    let newBody = [doc.content[1].table.body[0]]; // header conservé

                    // Appliquer le gras aux en-têtes
                    newBody[0].forEach(cell => {
                        if (cell && cell.text) {
                            cell.bold = true;
                        }
                    });

                    Object.keys(grouped).forEach(date => {
                        const rows = grouped[date];
                        // Récupérer la ligne brute pour solde initial
                        const rawRow = table.rows((idx, d) => d.date === date).data()[0];
                        const soldeDepart = rawRow.initial;
                        const soldeFin = rows[0][5].text || rows[0][5];

                        newBody.push([
                            {
                                text: `${date}                     |                         Solde départ: ${soldeDepart} CFA                        |                        Solde fin: ${soldeFin}`,
                                colSpan: 6,
                                bold: true,
                                fillColor: '#f5f5f5',
                                alignment: 'center'
                            },
                            {}, {}, {}, {}, {}
                        ]);

                        rows.forEach(r => {
                            // Appliquer les couleurs de fond aux colonnes
                            if (r[3]) r[3].fillColor = '#e6ffe6'; // vert clair pour "entrée"
                            if (r[4]) r[4].fillColor = '#ffcccc'; // rouge clair pour "sortie"
                            if (r[5]) r[5].fillColor = '#f0f0f0'; // gris clair pour "solde"
                            newBody.push(r);
                        });
                    });

                    doc.content[1].table.body = newBody;
                    doc.content[1].table.widths = ['5%', '35%', '15%', '15%', '15%', '15%'];

                    // Style général
                    doc.styles.tableHeader.fillColor = '#444';
                    doc.styles.tableHeader.color = 'white';
                    doc.styles.tableHeader.alignment = 'center';
                    doc.styles.tableHeader.bold = true;

                    // Bordures fines grises et centrage
                    let objLayout = {};
                    objLayout['hLineWidth'] = function (i) { return 0.5; };
                    objLayout['vLineWidth'] = function (i) { return 0.5; };
                    objLayout['hLineColor'] = function (i) { return '#cccccc'; };
                    objLayout['vLineColor'] = function (i) { return '#cccccc'; };
                    objLayout['paddingTop'] = function (i) { return 5; };
                    objLayout['paddingBottom'] = function (i) { return 5; };
                    objLayout['paddingLeft'] = function (i) { return 5; };
                    objLayout['paddingRight'] = function (i) { return 5; };
                    doc.content[1].layout = objLayout;

                    // Centrer le contenu
                    newBody.forEach(row => {
                        row.forEach(cell => {
                            if (cell && cell.text) {
                                cell.alignment = 'center';
                            }
                        });
                    });
                }


            }
        ],
        language: { url: '/api/datatable_json_fr' },
        columnDefs: [
            { targets: 0, width: '5%' },
            { targets: 1, width: '35%' },
            { targets: 2, width: '15%' },
            { targets: [3, 4, 5], width: '15%', className: 'text-end' }
        ],
        order: [[2, 'desc'], [0, 'asc']],
        paging: false,
        searching: false,
        info: false,

        drawCallback: function (settings) {
            const api = this.api();
            const rows = api.rows({ page: 'current' }).nodes();
            let last = null;

            api.column(2, { page: 'current' }).data().each(function (date, i) {
                if (last !== date) {
                    const rowsOfDate = api.rows((idx, data) => data.date === date).data().toArray();
                    if (rowsOfDate.length > 0) {
                        const soldeFin = rowsOfDate[0].solde;
                        const soldeDepart = rowsOfDate[rowsOfDate.length - 1].solde;
                        $(rows).eq(i).before(
                            `<tr class="table-group-cell bg-light">
                            <td colspan="6" class="fw-bold table-group-cell" style="background: lightgrey">
                                📅 ${date}
                                <span class="ms-3 text-primary">Solde départ : ${formatMoney(count == 0 ? api.rows((idx, data) => data.date === date).data().toArray()[0].initial : soldeDepart)} ${$('#deviseSelect').val()}</span>
                                <span class="ms-3 text-success">Solde fin : ${formatMoney(soldeFin)} ${$('#deviseSelect').val()}</span>
                            </td>
                        </tr>`
                        );
                    }
                    last = date;
                }
            });

            count += 1
        }
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
        updateUIByAgency()
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
                    <p class="mb-1"><strong>Devise local:</strong></p>
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
    $('#filterBtn').click(reloadTable);

    // Charger les transactions par défaut pour l'agence Bamako CFA
    if ($('#agenceSelect').val()) {
        $('#agenceSelect').trigger('change');
    }

    // Helper: Formatage d'argent
    function formatMoney(amount) {
        amount = parseFloat(amount)
        if (amount) return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
        else return 0;
    }

    function updateUIByAgency() {
        const selectedAgencyId = parseInt($('#agenceSelect').val());

        if (selectedAgencyId === 1) {
            $('#deviseSelect').prop('disabled', false).prop('readonly', false);
        } else {
            $('#deviseSelect').val('USD').prop('disabled', true).prop('readonly', true);
        }
    }

    // Fonction pour mettre à jour l'affichage des devises
    function reloadTable() {
        table.ajax.reload()
    }

});