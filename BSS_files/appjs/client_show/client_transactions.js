function initTransactions(clientId) {
    $('#filterTransactionType').on('change', () => transactionsTable.ajax.reload());
    $('#filterTransactionDate').daterangepicker({
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

    let startTransactionDate = null;
    let endTransactionDate = null;

    $('#filterTransactionDate').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startTransactionDate = picker.startDate.format('YYYY-MM-DD');
        endTransactionDate = picker.endDate.format('YYYY-MM-DD');
        transactionsTable.ajax.reload();
    });

    $('#filterTransactionDate').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startTransactionDate = null;
        endTransactionDate = null;
        transactionsTable.ajax.reload();
    });

    const transactionsTable = $('#transactionsTable').DataTable({
        dom: 'Bflrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
                className: 'btn btn-success',
                titleAttr: 'Exporter vers Excel',
                title: 'Transactions client',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                title: 'Transactions client',
                exportOptions: { columns: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
            },
            {
                text: '<i class="bi bi-printer"></i> Imprimer',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    printTransactionReport(clientId);
                }
            }
        ],
        ajax: {
            url: `/api/client/${clientId}/transactions`,
            data: d => { d.type = $('#filterTransactionType').val(); d.dateFrom = startTransactionDate; d.dateTo = endTransactionDate; },
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
                data: 'description',
                title: 'Description'
            },
            {
                data: 'amountCFA',
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
                data: 'amountAED',
                title: 'AED',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;

                }, visible: false,
            },
            {
                data: 'amountEUR',
                title: 'EUR',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: 'amountUSD',
                title: 'USD',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: 'amountGBP',
                title: 'GBP',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: 'amountCNY',
                title: 'CNY',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: 'amountMAD',
                title: 'MAD',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount > 0 ? amount.toLocaleString() : '--';
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: 'amountDZD',
                title: 'DZD',
                render: function (data) {
                    if (data === null) return '<span class="text-muted">0.00</span>';
                    const amount = parseFloat(data);
                    const formattedAmount = amount.toLocaleString();
                    const colorClass = amount < 0 ? 'text-danger' : 'text-success';
                    return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
                }, visible: false,
            },
            {
                data: null,
                title: 'Actions',
                render: function (data, type, row) {
                    if (row.type === "Versement" || row.type === "Retrait") {
                        return `
              <button class="btn btn-sm btn-outline-primary print-btn" data-id="${row.id}" title="Imprimer">
                <i class="bi bi-printer"></i>
              </button>
              <button class="btn btn-sm btn-outline-info modify-btn" data-id="${row.id}" title="Modifier">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger cancel-btn" data-id="${row.id}" title="Cancel">
                <i class="bi bi-x-circle"></i>
              </button>
            `;
                    } else {
                        return '';
                    }
                },
                orderable: false,
            }
        ],
        order: [[0, 'desc']],
        language: { url: '/api/datatable_json_fr' }
    });



    // Fonction d'impression du relevé de compte complet
    function printTransactionReport(clientId) {
        // Récupérer les données du client et des transactions
        // Ajout des paramètres dateFrom et dateTo à la requête
        const dateFrom = startTransactionDate;
        const dateTo = endTransactionDate;

        Promise.all([
            fetch(`/api/client/${clientId}/smalldetails`).then(r => r.json()),
            fetch(`/api/client/${clientId}/transactions_report?dateFrom=${encodeURIComponent(dateFrom || '')}&dateTo=${encodeURIComponent(dateTo || '')}`).then(r => r.json())
        ]).then(([clientData, transactionsData]) => {
            const printWindow = window.open('', '_blank', 'width=800,height=600');

            const currentDate = new Date().toLocaleDateString('fr-FR');
            let transactionsHTML = '';
            const solde = transactionsData.solde;

            transactionsData.data.forEach(transaction => {

                transactionsHTML += `
        <tr>
          <td>BSS-C${String(transaction.id).padStart(3, '0')}</td>
          <td>${transaction.date.split(' ')[0]}</td>
          <td>${transaction.description}</td>
          <td style="text-align: right;">${transaction.entree > 0 ? parseFloat(transaction.entree).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
          <td style="text-align: right;">${transaction.sortie > 0 ? parseFloat(transaction.sortie).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
          <td style="text-align: right;">${transaction.solde > 0 ? parseFloat(transaction.solde).toLocaleString('fr-FR') + ' FCFA' : ''}</td>
        </tr>
      `;
            });

            // Déterminer la période à afficher
            let periodeText = '';
            if (!dateFrom && !dateTo) {
                periodeText = "Depuis le début";
            } else {
                periodeText = `Période du ${dateFrom || ''} au ${dateTo || ''}`;
            }

            printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
      <title>Relevé de Compte - ${clientData.nomComplet}</title>
      <meta charset="UTF-8">
      <style>
        @page {
        size: A5 portrait;
        margin: 30px;
        }
        body {
        font-family: Arial, sans-serif;
        font-size: 10px;
        margin: 0;
        padding: 0;
        line-height: 1.2;
        }
        .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 5px;
        border-bottom: 2px solid #000;
        padding-bottom: 5px;
        }
        .header img {
        width: 80px;
        height: auto;
        }
        .company-info {
        text-align: right;
        font-size: 9px;
        }
        .title {
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        margin: 5px 0 10px;
        text-transform: uppercase;
        }
        .client-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 9px;
        }
        .transaction-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8px;
        margin-bottom: 10px;
        }
        .transaction-table th,
        .transaction-table td {
        border: 1px solid #000;
        padding: 3px;
        text-align: left;
        }
        .transaction-table th {
        background-color: #f0f0f0;
        font-weight: bold;
        }
        .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        font-size: 9px;
        }
        .signature {
        text-align: center;
        margin-top: 20px;
        font-size: 9px;
        }
        .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
        }
      </style>
      </head>
      <body>
      <div class="header">
        <div class="logo">
        <img src="${window.location.origin}/assets/img/logo.png" alt="Logo">
        </div>
        <div class="company-info">
        <small>Billeterie-Change-Transaction-Commerce Général</small><br>
        BKO IMM. PETIT BAROU<br>
        Tél: (+223) - 66626317 - 76260611<br>
        DUBAI: (+971) - 55 426 2144
        </div>
      </div>
      
      <div class="title">
        RELEVÉ DE COMPTE<br>
        <small>${periodeText}</small>
      </div>
      
      <div class="client-info">
        <div>
        <strong>Client:</strong> ${clientData.nomComplet}<br>
        <strong>Téléphone:</strong> ${clientData.phoneNumber || 'Non renseigné'}
        </div>
        <div>
        <strong>Adresse:</strong> ${clientData.address || 'Non renseignée'}<br>
        <strong>Date d'édition:</strong> ${currentDate}
        </div>
      </div>
      
      <table class="transaction-table">
        <thead>
        <tr>
          <th width="10%">Référence</th>
          <th width="10%">Date</th>
          <th width="33%">Description</th>
          <th width="15%">Dépôt</th>
          <th width="15%">Retrait</th>
          <th width="17%">Solde</th>
        </tr>
        </thead>
        <tbody>
        ${transactionsHTML}
        <tr class="total-row">
          <td colspan="3">SOLDE FINAL</td>
          <td></td>
          <td></td>
          <td style="text-align: right;">${solde.toLocaleString()} F CFA</td>
        </tr>
        </tbody>
      </table>
      
      <div class="signature">
        <p>Signature et cachet de l'entreprise</p>
        <p style="margin-top: 20px;">_________________________________</p>
      </div>
      
      <div class="footer">
        <div>BSS Consulting - Système de gestion client</div>
        <div>Page 1/1</div>
      </div>
      
      <script>
        window.onload = function() {
        window.print();
        setTimeout(function() {
          window.close();
        }, 1000);
        };
      </script>
      </body>
      </html>
    `);

            printWindow.document.close();
        }).catch(error => {
            console.error('Erreur lors de la génération du rapport:', error);
            alert('Erreur lors de la génération du rapport d\'impression');
        });
    }

    transactionsTable.on('click', '.print-btn', function () {
        id = $(this).data('id');
        window.open(`/api/transaction/${id}/receipt`, '_blank');
    });

    

    transactionsTable.on('click', '.modify-btn', function () {
        selectedTransactionID = $(this).data('id');
        $.get(`/api/transaction/${selectedTransactionID}/details`, function (data) {
            $("#editTransDate").val(data.date)
            $("#editTransAmount").val(data.montant)
            $("#editTransType").val(data.type)
        })

        $("#editTransactionModal").modal('show')
    });

    $('#confirmEditTrans').on('click', () => {
        $(this).prop('disabled', true)
        $.post('/api/transaction/' + selectedTransactionID + '/update',
            {
                montant: $("#editTransAmount").val(),
                date: $("#editTransDate").val()
            },
            () => {
                transactionsTable.ajax.reload()
                $("#editTransactionModal").modal('hide')
                showToastModal({ message: "Transaction modifiée avec succès", type: "success" });
                $(this).prop('disabled', false);

            }
        ).fail(function () {
            showToastModal({ message: "Echec de modification", type: "error" });
            $(this).prop('disabled', false);
        })
    }),

    transactionsTable.on('click', '.cancel-btn', function () {
        selectedTransactionID = $(this).data('id');
        console.log(selectedTransactionID);

        $("#confirmCancelTransactionModal").modal('show')
    });

    $('#confirmCancelTransaction').on('click', () => {
        console.log(selectedTransactionID);
        $(this).prop('disabled', true)
        $.post('/api/transaction/' + selectedTransactionID + '/cancel', { id: selectedTransactionID },
            () => {
                transactionsTable.ajax.reload();
                $("#confirmCancelTransactionModal").modal('hide')
                showToastModal({ message: "Transaction supprimée avec succès", type: "success" });
                $(this).prop('disabled', false);
            }
        ).fail(function () {
            showToastModal({ message: "Echec de suppression", type: "error" });
            $(this).prop('disabled', false);
        })
    })

}