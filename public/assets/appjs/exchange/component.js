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
                "data": "ref",
            },
            {
                "data": null,
                "render": function (data, type, row) {
                    const color = !row.clientId ? 'bg-primary' : 'bg-secondary';
                    return `<span class="badge ${color}">${!row.clientId ? 'direct' : 'client'}</span>`;
                }
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
                data: 'id', render: function (data, type, row) {
                // <button class="btn btn-sm btn-outline-primary btn-table-action view-exchange" data-id="${data}" title="Voir">
                //             <i class="bi bi-eye"></i>
                //         </button> 
                    let buttons = `
                        
                        <button class="btn btn-sm btn-outline-info btn-table-action edit-exchange" data-id="${data}" data-client="${row.clientId}" title="Modifier">
                            <i class="bi bi-pencil"></i>
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