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
                exportOptions: { columns: [1, 2, 3, 4] }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Operationss client',
                exportOptions: { columns: [1, 2, 3, 4] }
            }, 
        ],
        ajax: {
            url: `/api/client/${clientId}/operations`,
            data: d => { d.type = $('#filterOperationsType').val(); d.dateFrom = startOperationDate; d.dateTo = endOperationDate; },
        },
        columns: [
            {
                data: 'id',
                visible: false,
                searchable: false
            },
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
                            <button class="btn btn-sm btn-outline-primary print-btn" data-id="${row.ops_id}" data-ops="${row.operation}" title="Imprimer">
                                <i class="bi bi-printer"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-info modify-btn" data-id="${row.ops_id}" data-ops="${row.operation}" title="Modifier">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${row.ops_id}" data-ops="${row.operation}" title="Cancel">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        `; 
                }, 
            }
        ],
        order: [[0, 'desc']],
        language: { url: '/api/datatable_json_fr' }
    });

    $("#opsTable tbody").on("click", ".print-btn", function () {
        const operation = $(this).data("ops");
        const id = $(this).data("id");

        let url;

        if (operation === "Transfert") url = `/api/transferts/${id}/receipt`;
        else if (operation === "Change") url = `/api/exchanges/${id}/print`;
        else if (operation === "Versement" || operation === "Retrait") url = `/api/transaction/${id}/receipt`;
        else url = null;

        if (url) {
            window.open(url, "_blank");
        } else {
            alert("Type d’opération non reconnu.");
        }
    });

    $("#opsTable tbody").on("click", ".modify-btn", function () {
        const operation = $(this).data("ops");
        const id = $(this).data("id");
        

        if (operation === "Transfert") { 
            populateEditModal(id); 
        }
        else if (operation === "Change") {
            let tr = $(this).closest('tr');  

            // Appel à l'API Symfony pour récupérer les données complètes
            $.ajax({
                url: `/api/client/${clientId}/exchange/${id}`,
                type: 'GET',
                success: function (response) {
                    if (!response.success) {
                        alert("Erreur : " + response.message);
                        return;
                    }

                    let data = response.data;

                    // Remplir le modal Edit avec les données récupérées
                    $('#editExchangeRef').val(data.ref || "EX-" + data.id.toString().padStart(5, '0'));
                    $('#editDateOpsEchange').val(data.date.split(' ')[0]); // format YYYY-MM-DD
                    $('#editDestinationEchange').val(data.agence ? data.agence.id : '');
                    $('#editTypeOpsEchange').val(data.type);
                    $('#editDeviseExchange').val(data.devise);
                    $('#editMontantEchange').val(data.montant_devise);
                    $('#editDeviseEchange').text(data.devise);
                    $('#editTauxEchange').val((isFinite(data.taux) || !isNaN(parseFloat(data.taux))) ? parseFloat(data.taux).toFixed(6) : data.taux);
                    $('#editExchangeNote').val(data.description || '');

                    // Calculer et afficher le total
                    let total = parseFloat(data.montant_devise) * parseFloat(data.taux);
                    $('#editTotalAPayerEchange').text(total.toFixed(2) + " CFA");

                    // Afficher le modal
                    $('#editCurrencyModal').modal('show');
                    $('#editCurrencyModal').data('id', data.id)
                },
                error: function (xhr) {
                    console.error(xhr.responseText);
                    alert("Impossible de récupérer les informations de l'échange.");
                }
            });
        }
        else if (operation === "Versement" || operation === "Retrait") {
            selectedTransactionID = id
            $.get(`/api/transaction/${id}/details`, function (data) {
                $("#editTransDate").val(data.date)
                $("#editTransAmount").val(data.montant)
                $("#editTransType").val(data.type)
            })

            $("#editTransactionModal").modal('show')
        }
    })

    $("#opsTable tbody").on("click", ".cancel-btn", function () {
        const operation = $(this).data("ops");
        const id = $(this).data("id");
        

        if (operation === "Transfert") { 
            $('#confirmDeleteModal').data('id', id) 
            $('#confirmDeleteModal').modal('show');
        }
        else if (operation === "Change") { 
            $('#deleteConfirmModal').data('id', id)
            console.log($('#deleteConfirmModal').data('id')); 
            $('#deleteConfirmModal').modal('show');
        }
        else if (operation === "Versement" || operation === "Retrait") {
            selectedTransactionID = id 
            $("#confirmCancelTransactionModal").modal('show')
        }
    })
    
    
}