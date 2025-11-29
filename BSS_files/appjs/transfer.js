$(document).ready(function () {
    let clients = [];
    let currentTransferData = null;
    let transferId;
    let startTransfertDate
    let endTransfertDate
    const apiUrl = '/api/clients';

    const countryCodeCurrency = {
        'EAU': { code: "EAU", countryName: "Émirats Arabes Unis", capital: "Abou Dabi", currency: "AED", currencyName: "Dirham des Émirats Arabes Unis", USDValue: 3.67 },
        'FR': { code: "FR", countryName: "France", capital: "Paris", currency: "EUR", currencyName: "Euro", USDValue: 0.93 },
        'USA': { code: "USA", countryName: "États-Unis", capital: "Washington, D.C.", currency: "USD", currencyName: "Dollar américain", USDValue: 1.00 },
        'UK': { code: "UK", countryName: "Royaume-Uni", capital: "Londres", currency: "GBP", currencyName: "Livre sterling", USDValue: 0.80 },
        'CHI': { code: "CHI", countryName: "Chine", capital: "Pékin", currency: "CNY", currencyName: "Yuan chinois", USDValue: 7.24 },
        'MRC': { code: "MRC", countryName: "Maroc", capital: "Rabat", currency: "MAD", currencyName: "Dirham marocain", USDValue: 10.03 },
        'ALG': { code: "ALG", countryName: "Algérie", capital: "Alger", currency: "DZD", currencyName: "Dinar algérien", USDValue: 133.40 }
    };

    $.get(apiUrl, function (data) {

        if (data && data.data) {
            clients = data.data.map(item => ({
                id: item.id,
                text: `${item.nomComplet} (Tél: ${item.phoneNumber}, Solde: ${item.balance})`,
                phone: item.phoneNumber,
                balanceCFA: item.balanceCFA
            }));
            // Créer un datalist pour proposer des suggestions de noms indépendantes
            try {
                // Extraire les noms uniques
                const clientNames = Array.from(new Set(data.data.map(i => i.nomComplet).filter(Boolean)));
                // Construire le datalist
                let datalist = document.getElementById('clients-names-list');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'clients-names-list';
                    document.body.appendChild(datalist);
                } else {
                    datalist.innerHTML = '';
                }
                clientNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    datalist.appendChild(option);
                });

                // Lier les champs de nom au datalist sans autre comportement automatisé
                const nameInputs = [
                    'newExpediteurNom', 'senderActualName', 'nomBeneficiaire',
                    'editNewExpediteurNom', 'editSenderActualName', 'editNomBeneficiaire'
                ];
                nameInputs.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.setAttribute('list', 'clients-names-list');
                        // Ne pas propager d'événement qui remplirait d'autres champs
                        el.addEventListener('input', function (e) {
                            // simple sécurité : ne rien faire d'autre ici
                        });
                    }
                });
            } catch (e) {
                console.error('Erreur création datalist noms clients:', e);
            }
        }
    }).fail(function () {
        showToastModal({ message: 'Erreur de connexion', type: 'error' });
    });
    // Initialiser Select2 pour le sélecteur d'expéditeur
    $('#select-expediteur').select2({
        placeholder: "Rechercher un client...",
        allowClear: true,
        width: '100%',
    });

    $('#filterDateRange').daterangepicker({
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

    // Mettre à jour les champs cachés avec les dates sélectionnées
    $('#filterDateRange').on('apply.daterangepicker', function (ev, picker) {
        $(this).val(picker.startDate.format('YYYY-MM-DD') + ' - ' + picker.endDate.format('YYYY-MM-DD'));
        startTransfertDate = picker.startDate.format('YYYY-MM-DD');
        endTransfertDate = picker.endDate.format('YYYY-MM-DD');

        // Recharger la table avec les nouvelles dates
        tableTransfers.ajax.reload();
        chargerStatsTransferts();
    });

    $('#filterDateRange').on('cancel.daterangepicker', function (ev, picker) {
        $(this).val('');
        startTransfertDate = null;
        endTransfertDate = null;

        // Recharger la table avec les dates effacées
        tableTransfers.ajax.reload();
        chargerStatsTransferts();
    });
 

    // Initialiser DataTable avec récupération des données via AJAX
    const tableTransfers = $('#transfersTable').DataTable({
        ajax: {
            url: '/api/transferts',
            dataSrc: '',
            data: function (d) {
                // Ajout des paramètres de filtre à la requête
                d.status = $('#filterStatus').val();
                d.type = $('#filterType').val();
                d.clientType = $('#filterClientType').val();
                d.dateFrom = startTransfertDate;
                d.dateTo = endTransfertDate;
            }
        },
        columns: [
            {
                data: 'id', visible:false
                
            },
            {
                data: 'ref',orderable: false,
                render: function (data) {
                    return `<span class="text-secondary fw-bold">${data}</span>`;
                },
            },
            {
                data: 'createdAt',
                render: function (data) {
                    return `<span class="text-muted fw-bold">${moment(data).format('DD/MM/YYYY')}</span>`;
                },orderable: false,
                visible: true,
            }, 
            {
                data: 'expediteur',orderable: false,
                render: function (data, type, row) {
                    if (row.clientType === 'ephemeral') {
                        return `
                                        <div class="fw-bold">${data}</div>
                                        <small class="text-muted">Client éphémère</small>
                                    `;
                    } else {
                        return `
                                        <div class="fw-bold">${data}</div>
                                        <small class="text-muted">Client enregistré</small>
                                    `;
                    }
                }
            },
            {
                data: 'montantCFA',
                render: function (data) {
                    return `<span class="text-success fw-bold">${parseFloat(data).toLocaleString('fr-FR')} F CFA</span>`;
                },orderable: false,
                className: 'text-end'
            },
            {
                data: 'montantUSD',
                render: function (data) {
                    return `<span class="text-primary fw-bold">${parseFloat(data).toLocaleString('fr-FR')} $</span>`;
                },orderable: false,
                className: 'text-end'
            },
            {
                data: null,
                orderable: false,
                render: function (data, type, row) {
                    const total = parseFloat(row.montantCFA) + parseFloat(row.frais);
                    return `<span class="fw-bold">${total.toLocaleString('fr-FR')} F CFA</span>`;
                },
                className: 'text-end',
                orderable: false,
            },
            {
                data: 'status',
                orderable: false,
                render: function (data) {
                    const statusMap = {
                        'completed': { class: 'badge-completed', text: 'Complété', icon: 'check-circle' },
                        'pending': { class: 'badge-pending', text: 'En attente', icon: 'hourglass' },
                        'cancelled': { class: 'badge-cancelled', text: 'Annulé', icon: 'x-circle' },
                        'processing': { class: 'badge-processing', text: 'En cours', icon: 'arrow-repeat' }
                    };
                    const status = statusMap[data] || { class: '', text: data, icon: '' };
                    return `
                                    <span class="badge-status ${status.class}">
                                        <i class="bi bi-${status.icon} me-1"></i>${status.text}
                                    </span>
                                `;
                }
            },
            // Dans la configuration de DataTable, modifiez la colonne d'actions :
            {
                data: null,
                render: function (data, type, row) {
                    let actions = `
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-primary dropdown-toggle btn-table-action" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-gear"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item view-transfer" href="#" data-id="${row.id}" ><i class="bi bi-eye me-2"></i>Voir</a></li>
                    <li><a class="dropdown-item edit-transfer" href="#" data-id="${row.id}"><i class="bi bi-pencil-square me-2"></i>Modifier</a></li>
                    <li><a class="dropdown-item print-transfer" href="#" data-id="${row.id}"><i class="bi bi-printer me-2"></i>Imprimer</a></li>
        `;
                    if (row.status === 'processing') {
                        actions += `
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item validate-transfer" href="#" data-id="${row.id}"><i class="bi bi-check-circle me-2"></i>Valider</a></li>
                <li><a class="dropdown-item cancel-transfer" href="#" data-id="${row.id}"><i class="bi bi-x-circle me-2"></i>Annuler</a></li>
            `;
                    }
                    if (row.status === 'pending') {
                        actions += `
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item process-transfer" href="#" data-id="${row.id}"><i class="bi bi-arrow-repeat me-2"></i>Traiter</a></li> 
                <li><a class="dropdown-item cancel-transfer" href="#" data-id="${row.id}"><i class="bi bi-x-circle me-2"></i>Annuler</a></li>
            `;
                    } 
                        actions += `
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item delete-transfer" href="#" data-id="${row.id}"><i class="bi bi-trash me-2"></i>Supprimer</a></li> </ul></div>`;
                    return actions;
                },
                orderable: false,
                className: 'text-center'
            }

        ],
        order: [[0, 'DESC']],
        dom: 'Bflrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="bi bi-file-earmark-spreadsheet"></i> Exporter Excel',
                className: 'btn btn-success',
                titleAttr: 'Exporter vers Excel',
                title: 'Liste des transferts',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7],
                    
                },
                customize: function (xlsx) {
                    var sheet = xlsx.xl.worksheets['sheet1.xml'];

                    // Modifier le style des en-têtes
                    $('row:first c', sheet).attr('s', '2');
                }
            },
            {
                text: '<i class="bi bi-file-earmark-pdf"></i> Exporter PDF',
                className: 'btn btn-danger',
                titleAttr: 'Exporter vers PDF',
                action: function (e, dt, node, config) {

                    // 🕓 Récupération des dates sélectionnées (à adapter selon ton code)
                    const start = startTransfertDate ? moment(startTransfertDate).format('DD/MM/YYYY') : '';
                    const end = endTransfertDate ? moment(endTransfertDate).format('DD/MM/YYYY') : '';
                    const periodeTexte = start && end ? `Période : du ${start} au ${end}` : 'Période : toutes les dates';

                    // 💾 Nom de fichier dynamique
                    const fileName = `Transferts_${start.replace(/\//g, '-')}_au_${end.replace(/\//g, '-')}.pdf`;

                    // 📊 Récupération des données du DataTable
                    const data = dt.rows({ search: 'applied' }).data().toArray();

                    // 🧮 Calcul des totaux
                    let totalCFA = 0;
                    let totalUSD = 0;
                    data.forEach(row => {
                        totalCFA += parseFloat(row.montantCFA || 0);
                        totalUSD += parseFloat(row.montantUSD || 0);
                    });

                    // 🧰 Fonctions utilitaires
                    function cleanText(str) {
                        if (!str) return '';
                        return String(str)
                            .replace(/[^\x20-\x7E\u00A0\u20AC\u202F\u00C0-\u017F]/g, '')
                            .replace(/\s+/g, ' ')
                            .trim();
                    }

                    function formatMontant(value, suffix = '') {
                        if (isNaN(value)) return '-';
                        const formatted = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(value);
                        return cleanText(`${formatted} ${suffix}`);
                    }

                    // 🧱 Construction du tableau
                    const headers = [
                        { text: 'Réf', style: 'tableHeader' },
                        { text: 'Date', style: 'tableHeader' },
                        { text: 'Expéditeur', style: 'tableHeader' },
                        { text: 'Montant CFA', style: 'tableHeader' },
                        { text: 'Montant USD', style: 'tableHeader' },
                        { text: 'Total', style: 'tableHeader' },
                        { text: 'Statut', style: 'tableHeader' }
                    ];

                    const body = [headers];

                    data.forEach(row => {
                        const total = parseFloat(row.montantCFA) + parseFloat(row.frais || 0);
                        let statusText = '';
                        switch (row.status) {
                            case 'completed': statusText = '✅ Complété'; break;
                            case 'pending': statusText = '⏳ En attente'; break;
                            case 'cancelled': statusText = '❌ Annulé'; break;
                            case 'processing': statusText = '🔄 En cours'; break;
                            default: statusText = row.status;
                        }

                        body.push([
                            { text: cleanText(row.ref), style: 'cell' },
                            { text: moment(row.createdAt).format('DD/MM/YYYY'), style: 'cell' },
                            { text: cleanText(row.expediteur), style: 'cell' },
                            { text: formatMontant(row.montantCFA, 'F CFA'), style: 'amount' },
                            { text: formatMontant(row.montantUSD, '$'), style: 'amount' },
                            { text: formatMontant(total, 'F CFA'), style: 'amountBold' },
                            { text: cleanText(statusText), style: 'status' }
                        ]);
                    });

                    // 🧾 Définition du document PDF
                    const docDefinition = {
                        pageOrientation: 'landscape',
                        pageSize: 'A4',
                        content: [
                            { text: 'Liste des transferts', style: 'header' },
                            { text: periodeTexte, style: 'subHeader' },
                            {
                                text: `Total : ${formatMontant(totalUSD, '$')}`,
                                style: 'totaux'
                            },
                            {
                                text: `Généré le : ${moment().format('DD/MM/YYYY HH:mm')}`,
                                alignment: 'right',
                                margin: [0, 0, 0, 10],
                                fontSize: 9,
                                color: '#666'
                            },
                            {
                                table: {
                                    headerRows: 1,
                                    widths: ['15%', '10%', '20%', '15%', '10%', '15%', '15%'],
                                    body: body
                                },
                                layout: {
                                    fillColor: function (rowIndex) {
                                        return rowIndex === 0 ? '#007bff' : rowIndex % 2 === 0 ? '#f9f9f9' : null;
                                    },
                                    hLineWidth: function () { return 0.5; },
                                    vLineWidth: function () { return 0.5; },
                                    hLineColor: function () { return '#ccc'; },
                                    vLineColor: function () { return '#ccc'; },
                                    paddingLeft: function () { return 6; },
                                    paddingRight: function () { return 6; },
                                    paddingTop: function () { return 4; },
                                    paddingBottom: function () { return 4; }
                                }
                            }
                        ],
                        styles: {
                            header: {
                                fontSize: 18,
                                bold: true,
                                alignment: 'center',
                                color: '#007bff',
                                margin: [0, 0, 0, 5]
                            },
                            subHeader: {
                                alignment: 'center',
                                fontSize: 12,
                                color: '#333',
                                margin: [0, 0, 0, 5]
                            },
                            totaux: {
                                alignment: 'center',
                                fontSize: 11,
                                bold: true,
                                color: '#28a745',
                                margin: [0, 0, 0, 10]
                            },
                            tableHeader: {
                                bold: true,
                                color: 'white',
                                alignment: 'center',
                                fontSize: 11
                            },
                            cell: {
                                fontSize: 10,
                                color: '#333'
                            },
                            amount: {
                                alignment: 'right',
                                fontSize: 10,
                                color: '#28a745'
                            },
                            amountBold: {
                                alignment: 'right',
                                fontSize: 10,
                                bold: true,
                                color: '#000'
                            },
                            status: {
                                alignment: 'center',
                                fontSize: 10
                            }
                        },
                        footer: function (currentPage, pageCount) {
                            return {
                                text: `Page ${currentPage} sur ${pageCount}`,
                                alignment: 'center',
                                fontSize: 9,
                                margin: [0, 10, 0, 0],
                                color: '#666'
                            };
                        }
                    };

                    // 📄 Génération du PDF
                    pdfMake.createPdf(docDefinition).download(fileName);
                }
            } 
        ],
        language: {
            url: '/api/datatable_json_fr'
        },
        initComplete: function () {
            // Ajout des filtres personnalisés
            $('#transfersTable_filter').prepend(`
                <div class="btn-group ms-2">
                    <select id="filterStatus" class="form-select form-select-sm">
                        <option value="">Tous statuts</option>
                        <option value="completed">Complété</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annulé</option>
                        <option value="processing">En cours</option>
                    </select>
                    <select id="filterType" class="form-select form-select-sm">
                        <option value="">Tous types</option>
                        <option value="standard">Envoi Cash</option>
                        <option value="byAccount">Retrait compte</option>
                    </select>
                    <select id="filterClientType" class="form-select form-select-sm">
                        <option value="">Tous clients</option>
                        <option value="regular">Clients enregistrés</option>
                        <option value="ephemeral">Clients éphémères</option>
                    </select>
                </div>
            `);

            // Écouteurs d'événements pour les filtres
            $('#filterStatus, #filterType, #filterClientType, #filterDateRange').on('change', function () {
                tableTransfers.ajax.reload();
                chargerStatsTransferts();
            });
        }
    });
    // Initialiser la date avec la date du jour
    $('#dateOps').val(new Date().toISOString().split('T')[0]);

    $('#typeOps').on("change", () => {
        let typeOps = $('#typeOps').find(':selected').val()

        if (typeOps == "standard") {
            // recuperer le choix du client est optionnel et le client éphémère est possible
            $('#select-expediteur').find('option[value="vanish"]').prop('disabled', false)
            $('#moneyReceived').prop('disabled', false)
        } else {
            // client éphémère impossible
            $('#select-expediteur').find('option[value="vanish"]').prop('disabled', true)
            $('#moneyReceived').prop('checked', true)
            $('#moneyReceived').prop('disabled', true)
        }
    });

    // Mettre à jour le téléphone quand un expéditeur est sélectionné
    $('#select-expediteur').on('change', function () {
        if ($(this).val() == "vanish") {
            $('#new-client-section').removeClass('d-none')
            $('#expediteur-phone').html(``);
        } else {
            const selectedId = $(this).val();
            if (selectedId) {
                const client = clients.find(c => c.id == selectedId);
                $('#expediteur-phone').html(`
                        <div class="p-2 bg-light rounded">
                            <small class="text-muted">Téléphone :</small>
                            <div class="fw-bold">${client.phone}</div>
                            <small class="text-muted">Solde :</small>
                            <div class="fw-bold">${client.balanceCFA} F CFA</div>
                        </div>
                    `);
            } else {
                $('#expediteur-phone').html(`
                        <div class="p-2 bg-light rounded">
                            <small class="text-muted">Téléphone :</small>
                            <div class="fw-bold">-</div>
                            <small class="text-muted">Solde :</small>
                            <div class="fw-bold">-</div>
                        </div>
                    `);
            } $('#new-client-section').addClass('d-none');
        }
    });

    // Gestion du changement de destination
    $('#destination').change(function () {
        const destination = $(this).find(':selected').val();
        let abg
        $.get(`/api/agence/${destination}`,
            function (data, status) {
                abg = data['abg']
                // Mettre à jour les affichages de devise
                $('#deviseRecueDisplay').text(countryCodeCurrency[abg].currency);
                $('#nomDeviseReceptionTaux').html(
                    `
                        ${countryCodeCurrency[abg].currencyName}
                                    <span class="text-danger">*</span>
                        `
                );
                $('#tauxReception').val(countryCodeCurrency[abg].USDValue)

                // Recalculer les montants
                calculerMontants();
            });



    });

    // Écouteur pour ouvrir le modal de modification
    $('#transfersTable').on('click', '.edit-transfer', function (e) {
        e.preventDefault();
        transferId = $(this).data('id');
        openEditTransferModal(transferId);
    });


    $("#resetForm").on('click', () => {
        $('#totalAPayer').text(0 + ' CFA');
        $('#select-expediteur').find('option[value="vanish"]').prop('disabled', false)
        $('#moneyReceived').prop('disabled', false)
    });

    // Calcul des montants
    function calculerMontants() {
        const montantCash = parseFloat($('#montantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#fraisEnvoi').val()) || 0;
        const taux = parseFloat($('#taux').val()) || 1;
        const destination = $('[name="destination"]').val();
        const tauxReception = $('#tauxReception').val();

        // Calcul du montant reçu
        let montantRecu = 0;
        if (montantCash > 0 && taux > 0) {
            montantRecu = montantCash / taux;
        }

        // Calcul du montant en Dirhams si destination est Dubaï
        let montantReception = 0;
        if (taux > 0) {
            montantReception = montantRecu * tauxReception;
        }

        // Calcul du total à payer
        const totalAPayer = montantCash + fraisEnvoi;

        // Mise à jour des champs
        $('#montantRecu').val(montantRecu.toFixed(2));
        $('#montantDeviseReception').val(montantReception.toFixed(2));
        $('#totalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
    }

    // Écouteurs pour le recalcul automatique
    $('#montantCash, #fraisEnvoi, #taux').on('input', calculerMontants);

    // Soumission du formulaire
    $('#form-add-transfer').submit(function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn)

        // Validation
        const type = $('[name="type"]').val();
        const expediteurId = $('#select-expediteur').find(':selected').val();
        const isNewClient = expediteurId === 'vanish'; // Vérifie si l'option "Client éphémère" est sélectionnée

        if (type === 'byAccount' && !expediteurId) {
            showToastModal({ message: "Pour un retrait sur compte, vous devez sélectionner un client existant.", type: 'error', duration: 1000 });
            return;
        }

        if (isNewClient) {
            const nom = $('[name="newExpediteurNom"]').val();
            const phone = $('[name="newExpediteurPhone"]').val();
            if (!nom) {
                showToastModal({ message: "Veuillez remplir les champs du client éphémère", type: 'error', duration: 1000 });
                return;
            }
        }

        // Préparation des données
        const formData = {
            date: $('#dateOps').val() ? moment($('#dateOps').val()).format('YYYY-MM-DD') : null,
            type: $('#typeOps').val(),
            destination: $('#destination').val(),
            expediteur: expediteurId,
            // Inclure les données du client éphémère uniquement si un nouveau client est sélectionné
            ...(isNewClient && {
                newExpediteurNom: $('[name="newExpediteurNom"]').val(),
                newExpediteurPhone: $('[name="newExpediteurPhone"]').val()
            }),
            // Nom effectif de l'expéditeur et motif (optionnels)
            senderActualName: $('#senderActualName').val(),
            motif: $('#motif').val(),
            
            nomBeneficiaire: $('#nomBeneficiaire').val(),
            phoneBeneficiaire: $('#phoneBeneficiaire').val(),
            montantCash: $('#montantCash').val(),
            fraisEnvoi: $('#fraisEnvoi').val(),
            taux: $('#taux').val(),
            montantUSD: $('#montantRecu').val(),
            tauxReception: $('#tauxReception').val(),
            montantDeviseReception: $('#montantDeviseReception').val(),
            totalAPayer: $('#totalAPayer').text(),
            moneyReceived: $('#moneyReceived').prop('checked')

            
        };

        // Envoi des données via AJAX
        $.ajax({
            url: '/api/transfert/create', // Remplacez par l'URL de votre endpoint
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Transfert crée avec succès', type: 'success' });
                // Réinitialisation du formulaire
                $('#form-add-transfer').trigger("reset");
                $('#select-expediteur').val(null).trigger('change');
                $('#new-client-section').addClass('d-none');
                $('#select-expediteur').find('option[value="vanish"]').prop('disabled', false)
                $('#moneyReceived').prop('disabled', false)
                tableTransfers.ajax.reload()
                calculerMontants();

                transferId = response.transfertId;
                setTimeout( () => {window.open('/api/transferts/' + transferId + '/receipt', '_blank')}, 2000 ) 
            },
            error: function (xhr, status, error) {
                showToastModal({ message: !error && error != "" ? error : "Erreur de connexion", type: 'error' })
            }
        });
    });
    // Ouvrir le modal avec les données du transfert
    function openViewTransferModal(transferId) {
        // Simulation de données - remplacer par un appel AJAX réel
        $.get('/api/transferts/' + transferId, function (data) {
            currentTransferData = data;

            // Remplir les informations générales
            $('#transferReference').text(data.reference);
            $('#transferDate').text(new Date(data.createdAt).toLocaleDateString());
            $('#transferType').html(data.type === 'standard' ?
                '<span class="badge bg-primary">Envoi Cash</span>' :
                '<span class="badge bg-info">Retrait compte</span>');
            $('#transferDestination').text(countryCodeCurrency[data.destination.abg]['capital'] + ' - ' + countryCodeCurrency[data.destination.abg]['countryName']);

            // Remplir le statut avec le badge approprié
            let statusBadge = '';
            switch (data.status) {
                case 'completed':
                    statusBadge = '<span class="badge bg-success">Complété</span>';
                    break;
                case 'processing':
                    statusBadge = '<span class="badge bg-primary">Traitement</span>';
                    break;
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">En attente</span>';
                    break;
                case 'cancelled':
                    statusBadge = '<span class="badge bg-danger">Annulé</span>';
                    break;
                default:
                    statusBadge = '<span class="badge bg-secondary">' + data.status + '</span>';
            }
            $('#transferStatus').html(statusBadge);

            // Remplir les informations de l'expéditeur
            $('#transferRef').text(data.ref);
            $('#senderName').text(data.expediteur);
            $('#senderPhone').text(data.phone || '--');
            $('#senderType').text(data.clientType === 'ephemeral' ? 'Client éphémère' : 'Client enregistré');
            $('#senderId').text(data.expediteurId || '--');
            // Nom effectif et motif (affichage)
            $('#senderActualNameView').text(data.senderActualName || '--');
            $('#transferMotif').text(data.motif || '--');

            // Remplir les informations du bénéficiaire
            $('#beneficiaryName').text(data.receiverName || '--');
            $('#beneficiaryPhone').text(data.receiverPhone || '--');

            // Remplir les montants
            $('#transferAmount').text(data.montantCFA.toLocaleString('fr-FR') + ' F CFA');
            $('#transferFees').text(data.frais.toLocaleString('fr-FR') + ' F CFA');
            $('#transferRate').text('1 USD = ' + data.taux.toLocaleString('fr-FR') + ' F CFA');
            $('#transferAmountUSD').text((data.montantUSD).toLocaleString('fr-FR') + ' USD');
            $('#deviseDestination').text(countryCodeCurrency[data.destination.abg]['currencyName']);
            $('#destinationRate').text('1 USD = ' + countryCodeCurrency[data.destination.abg]['USDValue'] + ' ' + countryCodeCurrency[data.destination.abg]['currency']);
            $('#destinationAmount').text((data.montantReception).toLocaleString('fr-FR') + ' ' + countryCodeCurrency[data.destination.abg]['currency']);

            const total = parseFloat(data.montantCFA) + parseFloat(data.frais);
            $('#transferTotal').text(total.toLocaleString('fr-FR') + ' F CFA');

            // Afficher/masquer les boutons d'action selon le statut
            toggleActionButtons(data.status);

            // Afficher le modal
            $('#viewTransferModal').modal('show');
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Afficher/masquer les boutons d'action selon le statut
    function toggleActionButtons(status) {
        // Masquer tous les boutons d'abord
        $('#validateTransferBtn, #cancelTransferBtn, #deleteTransferBtn').addClass('d-none');

        // Afficher les boutons appropriés
        switch (status) {
            case 'pending':
                $('#validateTransferBtn, #cancelTransferBtn').removeClass('d-none');
                break;
            case 'cancelled':
                $('#deleteTransferBtn').removeClass('d-none');
                break;
            case 'completed':
                // Aucun bouton supplémentaire pour les transferts complétés
                break;
        }
    }    // Fonction pour prévenir les doubles envois
    function disableButton(button) {
        button.prop('disabled', true);
        setTimeout(() => {
            button.prop('disabled', false);
        }, 3000); // Réactiver après 3 secondes
    }

    $('#validateTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmValidateModal').modal('show');
    });

    $('#ProcessTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmProcessModal').modal('show');
    });

    $('#cancelTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmCancelModal').modal('show');
    });

    $('#deleteTransferBtn').on('click', function () {
        transferId = currentTransferData.id;
        $('#confirmDeleteModal').modal('show');
    });
 
    // Écouteurs pour ouvrir les modales de confirmation
    $('#transfersTable').on('click', '.validate-transfer', function () {
        transferId = $(this).data('id');
        $('#valid-date').val(new Date().toISOString().split('T')[0])
        $('#confirmValidateModal').modal('show');

    });

    // Écouteurs pour ouvrir les modales de confirmation
    $('#transfersTable').on('click', '.process-transfer', function () {
        transferId = $(this).data('id');
        $('#process-date').val(new Date().toISOString().split('T')[0])
        $('#confirmProcessModal').modal('show');

    });

    $('#transfersTable').on('click', '.cancel-transfer', function () {
        transferId = $(this).data('id');
        $('#confirmCancelModal').modal('show');
    });

    $('#transfersTable').on('click', '.delete-transfer', function () {
        transferId = $(this).data('id');
        $('#confirmDeleteModal').modal('show');
    });

    // Écouteurs pour les actions de confirmation
    $('#confirmValidate').click(function () {
        const button = $(this);
        disableButton(button);

        const valid_date = $('#valid-date').val()

        $.post('/api/transferts/' + transferId + '/validate/' + valid_date, function () {
            showToastModal({ message: 'Transfert validé avec succès!', type: 'success' });
            $('#confirmValidateModal').modal('hide');
            $('#viewTransferModal').modal('hide');
            tableTransfers.ajax.reload();
        }).fail(function () {
            showToastModal({ message: 'Erreur lors de la validation du transfert', type: 'error' });
        });
    });

    // Écouteurs pour les actions de confirmation
    $('#confirmProcess').click(function () {
        const button = $(this);
        disableButton(button);

        const process_date = $('#process-date').val()

        $.post('/api/transferts/' + transferId + '/process/' + process_date, function () {
            showToastModal({ message: 'Transfert mis en traitement !', type: 'success' });
            $('#confirmProcessModal').modal('hide');
            $('#viewTransferModal').modal('hide');
            tableTransfers.ajax.reload();
        }).fail(function () {
            showToastModal({ message: 'Erreur lors de la mise en traitement du transfert', type: 'error' });
        });
    });

    $('#confirmCancel').click(function () {
        const button = $(this);
        disableButton(button);

        $.post('/api/transferts/' + transferId + '/cancel', function () {
            showToastModal({ message: 'Transfert annulé avec succès!', type: 'success' });
            $('#confirmCancelModal').modal('hide');
            $('#viewTransferModal').modal('hide');
            tableTransfers.ajax.reload();
        }).fail(function () {
            showToastModal({ message: 'Erreur lors de l\'annulation du transfert', type: 'error' });
        });
    });

    $('#confirmDelete').click(function () {
        const button = $(this);
        disableButton(button);

        $.ajax({
            url: '/api/transferts/' + transferId + '/delete',
            type: 'DELETE',
            success: function () {
                showToastModal({ message: 'Transfert supprimé avec succès!', type: 'success' });
                $('#confirmDeleteModal').modal('hide');
                $('#viewTransferModal').modal('hide');
                tableTransfers.ajax.reload();
            },
            error: function () {
                showToastModal({ message: 'Erreur lors de la suppression du transfert', type: 'error' });
            }
        });
    });

    function chargerStatsTransferts() {
        $.ajax({
            url: '/api/transferts/stats',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                $('#stat-total').text(data.nombre_total ?? 0);
                $('#stat-valide').text(data.par_statut?.valide ?? 0);
                $('#stat-attente').text(data.par_statut?.en_attente ?? 0);
                $('#stat-annule').text(data.par_statut?.annule ?? 0);

                $('#stat-pending-cfa').text(`${parseFloat(data.pendings?.cfa).toLocaleString('fr-FR')} F CFA` ?? 0);
                $('#stat-pending-usd').text(`${parseFloat(data.pendings?.usd).toFixed(2).toLocaleString('fr-FR')} USD` ?? 0);
                $('#stat-pending-count').text(data.pendings?.count ?? 0);

                $('#stat-processing-cfa').text(`${parseFloat(data.processings?.cfa).toLocaleString('fr-FR')} F CFA` ?? 0);
                $('#stat-processing-usd').text(`${parseFloat(data.processings?.usd).toFixed(2).toLocaleString('fr-FR')} USD` ?? 0);
                $('#stat-processing-count').text(data.processings?.count ?? 0);

                $('#stat-montant').text(formatMontant(data.montant_total_cash ?? 0));
                $('#stat-recu').text(formatMontant(data.montant_total_reception ?? 0));
                $('#stat-frais').text(formatMontant(data.frais_totaux ?? 0));
            },
            error: function (xhr, status, error) {
                console.error('Erreur chargement statistiques:', error);
                showToastModal({ message: 'Erreur de connexion', type: 'error' });
            }
        });
    }

    function formatMontant(valeur) {
        return Number(valeur).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA';
    }

    // Écouteur pour l'impression du reçu
    $('#transfersTable').on('click', '.print-transfer', function () {
        transferId = $(this).data('id');
        window.open('/api/transferts/' + transferId + '/receipt', '_blank');
    });

    // Écouteur pour le téléchargement du reçu
    $('#transfersTable').on('click', '.download-transfer', function () {
        transferId = $(this).data('id');
        window.location.href = '/api/transferts/' + transferId + '/receipt?download=1';
    });

    // Écouteur pour ouvrir le modal de visualisation
    $('#transfersTable').on('click', '.view-transfer', function (e) {
        e.preventDefault();
        const id = $(this).data('id');
        openViewTransferModal(id);
    });

    calculerMontants();
    chargerStatsTransferts();

    function openEditTransferModal(transferId) {
        $.get('/api/transferts/' + transferId, function (data) {
            // Pré-remplir les champs du modal avec les données du transfert
            $('#editDateOps').val(data.createdAt.split(" ")[0]);
            $('#editTypeOps').val(data.type);
            $('#editDestination').val(data.destination.id);

            // Expéditeur
            if (data.clientType === 'ephemeral') {
                $('#editSelectExpediteur').val('vanish').trigger('change');
                $('#editNewExpediteurNom').val(data.expediteur);
                $('#editNewExpediteurPhone').val(data.phone);
                $('#editNewClientSection').removeClass('d-none');
            } else {
                $('#editSelectExpediteur').val(data.expediteurId).trigger('change');
            }

            // Bénéficiaire
            $('#editNomBeneficiaire').val(data.receiverName);
            $('#editPhoneBeneficiaire').val(data.receiverPhone);

            // Montants
            $('#editMontantCash').val(data.montantCFA);
            $('#editFraisEnvoi').val(data.frais);
            $('#editTaux').val(data.taux);
            $('#editMontantRecu').val(data.montantUSD);
            $('#editTauxReception').val(countryCodeCurrency[data.destination.abg]['USDValue']);
            $('#editMontantDeviseReception').val(data.montantReception);


        const montantCash = parseFloat($('#editMontantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#editFraisEnvoi').val()) || 0;
        const taux = parseFloat($('#editTaux').val()) || 1;
        const tauxReception = parseFloat($('#editTauxReception').val()) || 1;

        // Calcul du montant reçu
        let montantRecu = 0;
        if (montantCash > 0 && taux > 0) {
            montantRecu = montantCash / taux;
        }

        // Calcul du montant en devise de réception
        let montantReception = 0;
        if (montantRecu > 0 && tauxReception > 0) {
            montantReception = montantRecu * tauxReception;
        }

        // Calcul du total à payer
        const totalAPayer = montantCash + fraisEnvoi;

        // Mise à jour des champs
        $('#editMontantRecu').val(montantRecu.toFixed(2));
        $('#editMontantDeviseReception').val(montantReception.toFixed(2));
        $('#editTotalAPayer').text(totalAPayer.toFixed(2) + ' CFA'); 

            // remplir nom effectif/motif si fournis
            $('#editSenderActualName').val(data.senderActualName || '');
            $('#editMotif').val(data.motif || '');

            // Afficher le modal
            const modal = new bootstrap.Modal(document.getElementById('editTransferModal'));
            modal.show();
        }).fail(function () {
            showToastModal({ message: 'Erreur de connexion', type: 'error' });
        });
    }

    // Soumission du formulaire de modification
    $('#form-edit-transfer').submit(function (e) {
        e.preventDefault();
        const $form = $(this);
        const $btn = $form.find('button[type="submit"]');
        disableButton($btn);

        const type = $('#editTypeOps').val();
        const expediteurId = $('#editSelectExpediteur').find(':selected').val(); 
        const isNewClient = expediteurId === 'vanish'; // Vérifie si l'option "Client éphémère" est sélectionnée

        if (type === 'byAccount' && !expediteurId) {
            $('#editTransferModal').modal('hide');
            showToastModal({ message: "Pour un retrait sur compte, vous devez sélectionner un client existant.", type: 'error', duration: 1000 });
            return;
        }

        if (isNewClient) {
            const nom = $('#editNewExpediteurNom').val();
            const phone = $('#editNewExpediteurPhone').val();
            if (!nom) {
                $('#editTransferModal').modal('hide');
                showToastModal({ message: "Veuillez remplir les champs du client éphémère", type: 'error', duration: 1000 });
                return;
            }
        }

        // Préparation des données
        const formData = {
            id: transferId, // Assurez-vous que transferId est défini globalement ou récupéré depuis le modal
            date: $('#editDateOps').val(),
            type: $('#editTypeOps').val(),
            destination: $('#editDestination').val(),
            expediteur: expediteurId,
            ...(isNewClient && {
                newExpediteurNom: $('#editNewExpediteurNom').val(),
                newExpediteurPhone: $('#editNewExpediteurPhone').val()
            }),
            // Nom effectif et motif (optionnels)
            senderActualName: $('#editSenderActualName').val(),
            motif: $('#editMotif').val(),
            nomBeneficiaire: $('#editNomBeneficiaire').val(),
            phoneBeneficiaire: $('#editPhoneBeneficiaire').val(),
            montantCash: $('#editMontantCash').val(),
            fraisEnvoi: $('#editFraisEnvoi').val(),
            taux: $('#editTaux').val(),
            montantUSD: $('#editMontantRecu').val(),
            tauxReception: $('#editTauxReception').val(),
            montantDeviseReception: $('#editMontantDeviseReception').val(),
            totalAPayer: $('#editTotalAPayer').text(),
            moneyReceived: $('#editMoneyReceived').prop('checked')
        };

        // Envoi des données via AJAX
        $.ajax({
            url: '/api/transfert/update/' + transferId,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function (response) {
                showToastModal({ message: 'Transfert modifié avec succès', type: 'success' });
                // Fermer le modal
                $('#editTransferModal').modal('hide');
                // Recharger la table
                tableTransfers.ajax.reload();
            },
            error: function (xhr, status, error) {
                showToastModal({ message: !error && error != "" ? error : "Erreur de connexion", type: 'error' });
            }
        });
    });

    // Écouteurs pour le recalcul automatique dans le modal de modification
    $('#editMontantCash, #editFraisEnvoi, #editTaux, #editTauxReception').on('input', function () {
        const montantCash = parseFloat($('#editMontantCash').val()) || 0;
        const fraisEnvoi = parseFloat($('#editFraisEnvoi').val()) || 0;
        const taux = parseFloat($('#editTaux').val()) || 1;
        const tauxReception = parseFloat($('#editTauxReception').val()) || 1;

        // Calcul du montant reçu
        let montantRecu = 0;
        if (montantCash > 0 && taux > 0) {
            montantRecu = montantCash / taux;
        }

        // Calcul du montant en devise de réception
        let montantReception = 0;
        if (montantRecu > 0 && tauxReception > 0) {
            montantReception = montantRecu * tauxReception;
        }

        // Calcul du total à payer
        const totalAPayer = montantCash + fraisEnvoi;

        // Mise à jour des champs
        $('#editMontantRecu').val(montantRecu.toFixed(2));
        $('#editMontantDeviseReception').val(montantReception.toFixed(2));
        $('#editTotalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
    });

    // Gestion du changement de type d'opération dans le modal de modification
    $('#editTypeOps').on("change", () => {
        let typeOps = $('#editTypeOps').find(':selected').val();
        if (typeOps == "standard") {
            $('#editSelectExpediteur').find('option[value="vanish"]').prop('disabled', false);
            $('#editMoneyReceived').prop('disabled', false);
        } else {
            $('#editSelectExpediteur').find('option[value="vanish"]').prop('disabled', true);
            $('#editMoneyReceived').prop('checked', true);
            $('#editMoneyReceived').prop('disabled', true);
        }
    });

    // Gestion du changement de destination dans le modal de modification
    $('#editDestination').change(function () {
        const destination = $(this).find(':selected').val();
        $.get(`/api/agence/${destination}`, function (data, status) {
            const abg = data['abg'];
            // Mettre à jour les affichages de devise
            $('#editDeviseRecueDisplay').text(countryCodeCurrency[abg].currency);
            $('#editNomDeviseReceptionTaux').html(
                `${countryCodeCurrency[abg].currencyName} <span class="text-danger">*</span>`
            );
            $('#editTauxReception').val(countryCodeCurrency[abg].USDValue);
            // Recalculer les montants
            const montantCash = parseFloat($('#editMontantCash').val()) || 0;
            const fraisEnvoi = parseFloat($('#editFraisEnvoi').val()) || 0;
            const taux = parseFloat($('#editTaux').val()) || 1;
            const tauxReception = parseFloat($('#editTauxReception').val()) || 1;

            let montantRecu = 0;
            if (montantCash > 0 && taux > 0) {
                montantRecu = montantCash / taux;
            }

            let montantReception = 0;
            if (montantRecu > 0 && tauxReception > 0) {
                montantReception = montantRecu * tauxReception;
            }

            const totalAPayer = montantCash + fraisEnvoi;

            $('#editMontantRecu').val(montantRecu.toFixed(2));
            $('#editMontantDeviseReception').val(montantReception.toFixed(2));
            $('#editTotalAPayer').text(totalAPayer.toFixed(2) + ' CFA');
        });
    });

    // Mettre à jour le téléphone quand un expéditeur est sélectionné dans le modal de modification
    $('#editSelectExpediteur').on('change', function () {
        if ($(this).val() == "vanish") {
            $('#editNewClientSection').removeClass('d-none');
            $('#editExpediteurPhone').html(``);
        } else {
            const selectedId = $(this).val();
            if (selectedId) {
                const client = clients.find(c => c.id == selectedId);
                $('#editExpediteurPhone').html(`
                <div class="p-2 bg-light rounded">
                    <small class="text-muted">Téléphone :</small>
                    <div class="fw-bold">${client.phone}</div>
                    <small class="text-muted">Solde :</small>
                    <div class="fw-bold">${client.balanceCFA} F CFA</div>
                </div>
            `);
            } else {
                $('#editExpediteurPhone').html(`
                <div class="p-2 bg-light rounded">
                    <small class="text-muted">Téléphone :</small>
                    <div class="fw-bold">-</div>
                    <small class="text-muted">Solde :</small>
                    <div class="fw-bold">-</div>
                </div>
            `);
            }
            $('#editNewClientSection').addClass('d-none');
        }
    });



});