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
            dataSrc: function (json) {
                    // ici tu récupères la valeur de "initial"
                    initialGlobal = json.initial;
                    $('#peridoInitialAmount').text(formatMoney(initialGlobal) + ' ' + $('#deviseSelect').val());

                    // IMPORTANT : retourner le tableau 'data' pour que DataTables fonctionne
                    return json.data;
                },
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
            {
                data: 'reference',
                orderable: false,
                render: function (data) {
                    return data || '—';
                }
            },
            { data: 'description', orderable: false, render: (data) => data ? $('<div/>').text(data).html().replace(/\n/g, '<br>') : '' },
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
                title: 'Rapport Transactions ' + $('#agenceSelect').val() + ' : ' + dateRange.startDate + ' - ' + dateRange.endDate,
                exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
		        filename: function() {
                    var agence = $('#agenceSelect').find(':selected').text();
                    var startDate = $('#dateRange').data('daterangepicker').startDate.format('YYYY-MM-DD');
                    var endDate = $('#dateRange').data('daterangepicker').endDate.format('YYYY-MM-DD');
                    return 'Rapport ' + agence + ' du ' + startDate + ' à ' + endDate + '.pdf';
                }, 
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
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5] },
                title: function() {
                    var agence = $('#agenceSelect').find(':selected').text().trim();
                    var startDate = $('#dateRange').data('daterangepicker').startDate.format('YYYY-MM-DD').trim();
                    var endDate = $('#dateRange').data('daterangepicker').endDate.format('YYYY-MM-DD').trim();
                    return 'Rapport ' + agence + ' du ' + startDate + ' au ' + endDate + '.pdf';
                }, 
            
                customize: function (doc) {
                    // Réinitialiser le contenu
                    let content = [];

                    // Titre principal
                    content.push({
                        text: 'RAPPORT TRANSACTIONS',
                        alignment: 'center',
                        fontSize: 16,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    });

                    // Sous-titre
                    content.push({
                        text: $('#agenceSelect').find(':selected').text() + ' | ' + $('#dateRange').data('daterangepicker').startDate.format('DD/MM/YYYY') + ' - ' + $('#dateRange').data('daterangepicker').endDate.format('DD/MM/YYYY'),
                        alignment: 'center',
                        fontSize: 12,
                        margin: [0, 0, 0, 15],
                        color: '#666'
                    });

                    $(doc.content.body).children("h1:first").remove();

                    let grouped = {};
                    let totalEntrees = 0;
                    let totalSorties = 0;

                    // Calcul correct des totaux depuis les données DataTables
                    table.rows({ search: 'applied' }).every(function () {
                        let data = this.data();
                        totalEntrees += parseFloat(data.entree) || 0;
                        totalSorties += parseFloat(data.sortie) || 0;
                    });

                    // Ligne des totaux
                    content.push({
                        columns: [
                            {
                                text: `ENTRÉES: ${formatMoney(totalEntrees)} ${$('#deviseSelect').val()}`,
                                alignment: 'center',
                                bold: true,
                                fontSize: 11,
                                color: '#2e7d32',
                                margin: [0, 5, 10, 15],
                                background: '#e8f5e9'
                            },
                            {
                                text: `SORTIES: ${formatMoney(totalSorties)} ${$('#deviseSelect').val()}`,
                                alignment: 'center',
                                bold: true,
                                fontSize: 11,
                                color: '#c62828',
                                margin: [0, 5, 0, 15],
                                background: '#ffebee'
                            }
                        ],
                        columnGap: 20,
                        margin: [0, 0, 0, 15]
                    });

                    // Récupérer le tableau original
                    let originalTable = doc.content[1].table;
                    let newBody = [originalTable.body[0]]; // header conservé

                    // Appliquer le gras aux en-têtes
                    newBody[0].forEach(cell => {
                        if (cell && cell.text) {
                            cell.bold = true;
                        }
                    });

                    // Grouper les données par date
                    originalTable.body.forEach((row, idx) => {
                        if (idx === 0) return; // skip header
                        const date = row[2].text || row[2];
                        if (!grouped[date]) grouped[date] = [];
                        grouped[date].push(row);
                    });

                    // Construire le nouveau corps du tableau avec regroupement
                    Object.keys(grouped).forEach(date => {
                        const rows = grouped[date];
                        const rawRow = table.rows((idx, d) => d.date === date).data()[0];
                        const soldeDepart = formatMoney(rawRow.initial);
                        const soldeFin = rows[rows.length - 1][5].text || rows[0][5];

                        // Ligne de regroupement par date
                        // colorer les montants selon leur signe
                        const sdNum = parseFloat(rawRow.initial) || 0;
                        const sfNum = parseFloat(String(soldeFin).replace(/[^0-9\-,.\s]/g, '').replace(',', '.')) || 0;
                        const sdColor = sdNum >= 0 ? '#0d6efd' : '#c62828'; // bleu pour positif, rouge pour négatif
                        const sfColor = sfNum >= 0 ? '#2e7d32' : '#c62828'; // vert pour positif, rouge pour négatif

                        newBody.push([
                            {
                                text: [
                                    { text: `📅 ${date} | Solde départ: ` },
                                    { text: `${soldeDepart} ${$('#deviseSelect').val()}`, color: sdColor, bold: true },
                                    { text: ` | Solde fin: ` },
                                    { text: `${soldeFin}`, color: sfColor, bold: true }
                                ],
                                colSpan: 6,
                                fillColor: '#f8f9fa',
                                alignment: 'center',
                                fontSize: 10,
                                margin: [5, 3, 5, 3]
                            },
                            {}, {}, {}, {}, {}
                        ]);

                        // Ajouter les lignes de données
                        rows.forEach(r => {
                            if (r[3]) {
                                r[3].fillColor = '#e8f5e9';
                                r[3].color = '#2e7d32';
                            }
                            if (r[4]) {
                                r[4].fillColor = '#ffebee';
                                r[4].color = '#c62828';
                            }
                            if (r[5]) {
                                r[5].fillColor = '#f5f5f5';
                                r[5].color = '#333';
                            }
                            newBody.push(r);
                        });
                    });

                    // Ajouter le tableau au contenu
                    content.push({
                        table: {
                            headerRows: 1,
                            widths: ['10%', '35%', '15%', '12%', '13%', '15%'],
                            body: newBody
                        },
                        layout: {
                            hLineWidth: function (i) { return 0.5; },
                            vLineWidth: function (i) { return 0.5; },
                            hLineColor: function (i) { return '#dddddd'; },
                            vLineColor: function (i) { return '#dddddd'; },
                            paddingTop: function (i) { return 6; },
                            paddingBottom: function (i) { return 6; },
                            paddingLeft: function (i) { return 5; },
                            paddingRight: function (i) { return 5; }
                        }
                    });

                    // Remplacer le contenu entier
                    doc.content = content;

                    // Styles globaux
                    doc.styles = {
                        tableHeader: {
                            fillColor: '#34495e',
                            color: 'white',
                            alignment: 'center',
                            bold: true,
                            fontSize: 10
                        },
                        title: {
                            alignment: 'center',
                            fontSize: 16,
                            bold: true,
                            margin: [0, 0, 0, 10]
                        }
                    };

                    // Footer avec date de génération
                    var now = new Date();
                    var dateStr = now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR');

                    doc.footer = function (currentPage, pageCount) {
                        return {
                            columns: [
                                {
                                    text: 'Généré le ' + dateStr,
                                    alignment: 'left',
                                    fontSize: 8,
                                    color: '#999',
                                    margin: [40, 0, 0, 0]
                                },
                                {
                                    text: 'Page ' + currentPage.toString() + ' sur ' + pageCount,
                                    alignment: 'right',
                                    fontSize: 8,
                                    color: '#999',
                                    margin: [0, 0, 40, 0]
                                }
                            ],
                            margin: [0, 20, 0, 0]
                        };
                    };

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
        ordering: false,
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
                        const soldeFin = rowsOfDate[rowsOfDate.length - 1].solde;
                        const soldeDepart = rowsOfDate[rowsOfDate.length - 1].initial;
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