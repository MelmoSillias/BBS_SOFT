$(document).ready(
    () => { 
        let exchangeToDelete = null;
        let selectedExchange = null;

        // Initialisation de la table avec DataTables
        const exchangesTable = $('#exchangesTable').DataTable({
            "order": [[0, "desc"]], // Trier par la première colonne (Date) en ordre décroissant
            language: { url: '/api/datatable_json_fr' },
            "ajax": {
                "url": `/api/client/${extractClientId()}/exchanges`,
                "dataSrc": ""
            },
            "dom": 'Bfrtip', // Ajouter les boutons d'exportation
            "buttons": [
                {
                    extend: 'excelHtml5',
                    text: 'Exporter en Excel',
                    title: 'Liste_des_Échanges'
                },
                {
                    extend: 'pdfHtml5',
                    text: 'Exporter en PDF',
                    title: 'Liste_des_Échanges'
                },
                {
                    extend: 'print',
                    text: 'Imprimer',
                    title: 'Liste_des_Échanges'
                }
            ],
            "columns": [
                {
                    "data": "date",
                    "render": function (data, type, row) {
                        // Formater la date pour un affichage plus lisible
                        return new Date(data).toLocaleString('fr-FR');
                    }
                },
                {
                    "data": "type",
                    "render": function (data, type, row) {
                        // Afficher le type d'opération (achat/vente)
                        return data.charAt(0).toUpperCase() + data.slice(1);
                    }
                },
                {
                    "data": null,
                    "render": function (data, type, row) {
                        // Afficher le montant en devise
                        return `${row.montantDevise} ${row.devise}`;
                    }
                },
                {
                    "data": null,
                    "render": function (data, type, row) {
                        // Afficher le montant en CFA
                        return `${row.montantCFA} CFA`;
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
                    "data": null,
                    "render": function (data, type, row) {
                        // Boutons d'action
                        return `
                            <button class="btn btn-info btn-sm view-btn text-white" data-id="${row.id}"> 
                                <i class="bi bi-eye"></i> 
                            </button>
                            <button class="btn btn-danger btn-sm delete-btn text-white" data-id="${row.id}"> 
                                <i class="bi bi-trash"></i>  
                            </button>
                            <button class="btn btn-secondary btn-sm print-btn text-white" data-id="${row.id}"> 
                                <i class="bi bi-printer"></i>  
                            </button>
                        `;
                    }
                }
            ]
        });


        $('#exchangesTable tbody').on('click', '.view-btn', function () {
            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();

            // Remplir le modal avec les données
            $('#detail-from-amount').text(exchangeData.fromAmount);
            $('#detail-from-currency').text(exchangeData.fromCurrency);
            $('#detail-to-amount').text(exchangeData.toAmount);
            $('#detail-to-currency').text(exchangeData.toCurrency);
            $('#detail-date').text(formatDate(exchangeData.date));
            $('#detail-taux').text(exchangeData.taux);
            $('#detail-reference').text("EX-" + exchangeData.id.toString().padStart(5, '0'));
            $('#detail-status').text("Complété");
            $('#detail-notes').text("Échange standard effectué sans problème.");


            selectedExchange = exchangeData.id
            // Afficher le modal
            $('#exchangeDetailModal').modal('show');
        });

        $('#exchangesTable tbody').on('click', '.delete-btn', function () {
            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();
            exchangeToDelete = exchangeData.id;

            // Remplir le modal de confirmation
            $('#delete-reference').text("EX-" + exchangeData.id.toString().padStart(5, '0'));
            $('#delete-date').text(formatDate(exchangeData.date));
            $('#delete-amount').text(`${exchangeData.fromAmount} ${exchangeData.fromCurrency}`);

            // Afficher le modal de confirmation
            $('#deleteConfirmModal').modal('show');
        });


        // Gestion des événements pour les boutons "Supprimer"
        $('#exchangesTable tbody').on('click', '.delete-btn', function () {
            let id = $(this).data('id');
            exchangeToDelete = id;

            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();
            exchangeToDelete = exchangeData.id;

            // Remplir le modal de confirmation
            $('#delete-reference').text(exchangeData.reference);
            $('#delete-date').text(formatDate(exchangeData.date));
            $('#delete-amount').text(`${exchangeData.fromAmount} ${exchangeData.fromCurrency}`);

            // Afficher le modal de confirmation
            $('#deleteConfirmModal').modal('show');
        });

        // Confirmation de suppression
        $('#confirm-delete-btn').on('click', function () {
            if (exchangeToDelete) {
                // Effectuer la suppression via AJAX
                $.ajax({
                    url: `/api/exchanges/${exchangeToDelete}`,
                    method: 'DELETE',
                    success: function (response) {
                        // Recharger le tableau
                        loadClientSoldes(extractClientId())
                        exchangesTable.ajax.reload();
                        // Afficher un message de succès
                        showToastModal({ message: 'Échange supprimé avec succès.', type: 'success' });
                    },
                    error: function (xhr, status, error) {
                        showToastModal({ message: "Erreur lors de la suppresion", type: 'error' })
                    },
                    complete: function () {
                        // Fermer le modal
                        $('#deleteConfirmModal').modal('hide');
                        exchangeToDelete = null;
                    }
                });
            }
        });

        $('#exchangesTable tbody').on('click', '.print-btn', function () {
            var id = $(this).data('id');
            window.open(`/api/exchanges/${id}/print`, '_blank');
            // Ajoutez ici la logique pour imprimer
        });

        // Imprimer depuis le modal de détails
        $('#detail-print-btn').on('click', function () {
            let id = selectedExchange;
            window.open(`/api/exchanges/${id}/print`, '_blank');
        }); 

  
    }
)