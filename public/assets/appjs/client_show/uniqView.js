function initOps(clientId) {
    // $('#opsFilterOperationsType').on('change', () => operationsTable.ajax.reload());
    $('#opsFilterDateRange').daterangepicker({
        locale: {
            format: 'YYYY-MM-DD',
            applyLabel: 'Appliquer',
            cancelLabel: 'Annuler',
            daysOfWeek: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
            monthNames: [
                'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ],
            firstDay: 1
        },
        autoUpdateInput: false,
        opens: 'right'
    }); 

    let startOperationDate = null;
    let endOperationDate = null;

    $('#opsFilterDateRange').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startOperationDate = picker.startDate.format('YYYY-MM-DD');
        endOperationDate = picker.endDate.format('YYYY-MM-DD');
        operationsTable.ajax.reload();
    });

    $('#opsFilterDateRange').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startOperationDate = null;
        endOperationDate = null;
        operationsTable.ajax.reload();
    });

    const operationsTable = $('#opsTable').DataTable({
        dom: 'Bflrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
                className: 'btn btn-success',
                titleAttr: 'Exporter vers Excel',
                title: 'Operationss client',
                exportOptions: { columns: [0, 1, 2, 3, 4] }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Operationss client',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
            }, 
        ],
        ajax: {
            url: `/api/client/${clientId}/operations`,
            data: d => { d.type = $('#filterOperationsType').val(); d.dateFrom = startOperationDate; d.dateTo = endOperationDate; },
        },
        columns: [
            {
                data: 'id',
                title: 'Reference',
                render: (data) => { return 'BSS-C' + String(data).padStart(3, '0'); }
            },
            {
                data: 'date',
                title: 'Date',
                render: (data) => { return data.split(" ")[0]; }
            },
             {
                data: 'operation',
                title: 'Opération',
                render: (data) => { return data.split(" ")[0]; }
            },
            {
                data: 'description',
                title: 'Description'
            },
            {
                data: 'montant',
                title: 'CFA',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function (data, type, row) {
                       return `
                            <button class="btn btn-sm btn-outline-primary print-btn" data-id="${row.id}" data-ops="${row.operation}" title="Imprimer">
                                <i class="bi bi-printer"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info modify-btn" data-id="${row.id}" data-ops="${row.operation}" title="Modifier">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${row.id}" data-ops="${row.operation}" title="Cancel">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `; 
                },
                orderable: false,
            }
        ],
        order: [[0, 'desc']],
        language: { url: '/api/datatable_json_fr' }
    });

    operationsTable.on("click", '.print-btn', () => {
        const operation = $(this).data("ops")
        const id =  $(this).data("id")
        let url 

        if (operation == "transfer") url = "/api/transfer/"
    })
    
}