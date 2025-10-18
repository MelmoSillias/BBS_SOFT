$(document).ready(
    () => {
        let exchangeToDelete = null;
        let selectedExchange = null;

        const clientId = extractClientId();

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
                            <button class="btn btn-warning btn-sm edit-btn text-white" data-id="${row.id}">
                                <i class="bi bi-pencil"></i>
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


        // --- Bouton ÉDITER ---
        $('#exchangesTable tbody').on('click', '.edit-btn', function () {
            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();

            let exchangeId = exchangeData.id;
            selectedExchange = exchangeId

            // Appel à l'API Symfony pour récupérer les données complètes
            $.ajax({
                url: `/api/client/${clientId}/exchange/${exchangeId}`,
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
                    $('#editTauxEchange').val(data.taux);
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
        });


        $('#exchangesTable tbody').on('click', '.view-btn', function () {
            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();

            let exchangeId = exchangeData.id;

            // Vérification basique
            if (!exchangeId) {
                alert("Informations manquantes pour afficher les détails de l’échange.");
                return;
            }

            // 🔄 Appel AJAX pour récupérer les détails complets de l’échange
            $.ajax({
                url: `/api/client/${clientId}/exchange/${exchangeId}`,
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    if (!response.success || !response.data) {
                        alert("Erreur : " + (response.message || "Impossible de récupérer les informations."));
                        return;
                    }

                    let data = response.data;

                    // 🧾 Formatage sécurisé des champs
                    const ref = data.ref || "EX-" + data.id.toString().padStart(5, '0');
                    const date = data.date ? new Date(data.date).toLocaleString('fr-FR') : "—";
                    const agence = data.agence ? data.agence.designation : "—";
                    const type = data.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : "—";
                    const devise = data.devise || "—";
                    const montant = data.montant_devise?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || "0.00";
                    const taux = data.taux?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || "0.00";
                    const total = (parseFloat(data.montant_devise) * parseFloat(data.taux) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
                    const note = data.description || "Aucune note.";

                    // 🧩 Remplir le modal avec les données
                    $('#viewRef').text(ref);
                    $('#viewDateOpsEchange').text(date);
                    $('#viewDestinationEchange').text(agence);
                    $('#viewTypeOpsEchange').text(type);
                    $('#viewDeviseExchange').text(devise);
                    $('#viewMontantEchange').text(montant);
                    $('#viewDeviseEchange').text(devise);
                    $('#viewTauxEchange').text(taux);
                    $('#viewTotalAPayerEchange').text(total + " CFA");
                    $('#viewExchangeNote').text(note);

                    // Afficher le modal
                    $('#viewCurrencyModal').modal('show');
                },
                error: function (xhr) {
                    console.error(xhr.responseText);
                    alert("Erreur serveur : impossible de récupérer les informations de l'échange.");
                }
            });
        });
 
        $('#exchangesTable tbody').on('click', '.delete-btn', function () {
            let tr = $(this).closest('tr');
            let row = exchangesTable.row(tr);
            let exchangeData = row.data();
            exchangeToDelete = exchangeData.id; 
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
            $('#deleteConfirmModal').data('id', exchangeData.id)
            // Afficher le modal de confirmation
            $('#deleteConfirmModal').modal('show');
        });

        // Confirmation de suppression
        $('#confirm-delete-btn').on('click', function () { 
            const id = $('#deleteConfirmModal').data('id') ;
            if (id) {
                // Effectuer la suppression via AJAX
                $.ajax({
                    url: `/api/exchanges/${id}`,
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