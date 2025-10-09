$(document).ready(function() {
    // Définir la date par défaut
    $('#dateSelector').val(new Date().toISOString().split('T')[0]);

    // Fonction pour formater les nombres
    function formatNumber(num) {
        return new Intl.NumberFormat('fr-FR').format(num);
    }

    // Fonction pour mettre à jour les statistiques
    function updateStats(data) {
    // Mise à jour des valeurs principales
    $('#totalClients').text(formatNumber(data.totalClients.value));
    $('#capitalCFA').text(formatNumber(data.capitalCFA.value) + ' FCFA');
    $('#dailyOperations').text(formatNumber(data.dailyOperations.value));
    $('#dailyTransfers').text(formatNumber(data.dailyTransfers.value));
    $('#dailyIncomes').text(formatNumber(data.dailyIncomes.value) + ' FCFA');
    $('#dailyOutcomes').text(formatNumber(data.dailyOutcomes.value) + ' FCFA');
    $('#totalExchanges').text(formatNumber(data.totalExchanges.value));
    $('#clientOperations').text(formatNumber(data.clientOperations.value));

    // Mise à jour des statistiques secondaires
    $('#newClientsToday').text(data.totalClients.secondary + ' nouveau(x) aujourd\'hui');
    $('#capitalCFATrend').text(data.capitalCFA.secondary);
    $('#dailyOperationsAvg').text(data.dailyOperations.secondary);
    $('#dailyTransfersPending').text(data.dailyTransfers.secondary);
    $('#dailyIncomesTrend').text(data.dailyIncomes.secondary);
    $('#dailyOutcomesTrend').text(data.dailyOutcomes.secondary);
    $('#totalExchangesTop').text(data.totalExchanges.secondary);
    $('#clientOperationsTrend').text(data.clientOperations.secondary);
}


    // Fonction pour afficher les transferts en attente
    function renderPendingTransfers(transfers) {
        const $container = $('#pendingTransfersList');
        if (transfers.length === 0) {
            $container.html(`
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-inbox display-5"></i>
                    <p class="mt-3 fs-5">Aucun transfert en attente</p>
                </div>
            `);
            return;
        }
        let html = '<div class="transfers-list">';
        $.each(transfers, function(index, transfer) {
            if(transfer.status === 'pending' || transfer.status === 'processing' ) {

                    const statusMap = { 
                        'pending': { class: 'badge-pending', text: 'En attente', icon: 'hourglass' }, 
                        'processing': { class: 'badge-processing', text: 'En cours', icon: 'arrow-repeat' }
                    };
                    const status = statusMap[transfer.status] || { class: '', text: data, icon: '' }; 

                    html += `
                    <div class="transfer-item p-3 mb-2 bg-light border rounded d-flex align-items-center justify-content-between">
                        <div class="transfer-details">
                            <h6 class="mb-1 fw-bold">${transfer.reference}</h6>
                            <p class="mb-1 text-muted"><strong>Expediteur :</strong> ${transfer.client}</p>
                            <p class="mb-0 text-muted"><strong>Destination :</strong> ${transfer.destination}</p>
                            <p class="mb-1 text-muted"><strong>Montant CFA :</strong> ${formatNumber(transfer.amount)} ${transfer.currency}</p> 
                            <p class="mb-1 text-muted"><strong>Montant USD :</strong> ${formatNumber(transfer.usd)} $US</p>
                        </div>
                        <div class="transfer-actions d-flex align-items-center gap-2"> 
                            <span class="badge-status ${status.class}">
                                <i class="bi bi-${status.icon} me-1"></i>${status.text}
                            </span> 

                        </div>
                    </div>
                `;
            }

            // <button class="btn btn-sm btn-outline-success btn-action" data-bs-toggle="modal" data-bs-target="#confirmValidateModal" data-transfer-id="${transfer.id}">
            //                     <i class="bi bi-check-lg"></i> Valider
            //                 </button>
            //                 <button class="btn btn-sm btn-outline-danger btn-action" data-bs-toggle="modal" data-bs-target="#confirmCancelModal" data-transfer-id="${transfer.id}">
            //                     <i class="bi bi-x-lg"></i> Annuler
            //                 </button>
            
        });
        html += '</div>';
        $container.html(html);
    }

    // Fonction pour afficher les soldes
    function renderBalances(balances) {
        const $container = $('#balancesTable');
        if (balances.length === 0) {
            $container.html(`
                <div class="text-center text-muted py-5">
                    <i class="bi bi-info-circle me-2"></i> Aucun solde à afficher
                </div>
            `);
            return;
        }

        // Filtrer les devises avec solde > 0, mais toujours afficher CFA et USD
        const filteredBalances = balances.filter(b =>
            b.balance > 0 || ['CFA', 'USD'].includes(b.currency)
        );

        let html = '<div class="row g-4">';
        $.each(filteredBalances, function(index, balance) {
            let trendIcon = '';
            let trendClass = '';
            if (balance.trend === 'up') {
                trendIcon = '<i class="bi bi-arrow-up-right-circle-fill me-1"></i>';
                trendClass = 'text-success';
            } else if (balance.trend === 'down') {
                trendIcon = '<i class="bi bi-arrow-down-right-circle-fill me-1"></i>';
                trendClass = 'text-danger';
            } else {
                trendIcon = '<i class="bi bi-dash-circle-fill me-1"></i>';
                trendClass = 'text-secondary';
            }
            html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h5 class="card-title mb-0">${balance.currency}</h5>
                                <span class="${trendClass} fs-5">${trendIcon}</span>
                            </div>
                            <p class="mb-1">
                                <span class="text-muted">Solde</span><br>
                                <strong class="fs-5">${formatNumber(balance.balance)}</strong>
                            </p>
                            <p class="mb-0">
                                <span class="text-muted">Équivalent</span><br>
                                <strong>${formatNumber(balance.equivalent)} FCFA</strong>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        $container.html(html);
    }

    // Fonction pour initialiser les graphiques
    function initCharts(balanceData, operationsData) {
        // Graphique d'évolution des soldes
        const balanceCtx = $('#balanceEvolutionChart')[0].getContext('2d');
        new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: balanceData.labels,
                datasets: balanceData.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Graphique des opérations
        const operationsCtx = $('#operationsChart')[0].getContext('2d');
        new Chart(operationsCtx, {
            type: 'bar',
            data: {
                labels: operationsData.labels,
                datasets: operationsData.datasets
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return value / 1000000 + 'M';
                            }, 
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Fonction pour charger les données depuis l'API
    function loadDashboardData(date) {
        $.ajax({
            url: `/api/dashboard/${date}/stats`,
            method: 'GET',
            data: { date: date },
            success: function(response) {
                updateStats(response.stats);
                renderPendingTransfers(response.pendingTransfers);
                renderBalances(response.balances);
                initCharts(response.balanceEvolution, response.operations);
            },
            error: function(xhr, status, error) {
                console.error("Erreur lors du chargement des données:", error);
                alert("Une erreur est survenue lors du chargement des données.");
            }
        });
    }

    // Initialiser le tableau de bord
    loadDashboardData($('#dateSelector').val());

    // Gestion du changement de date
    $('#dateSelector').on('change', function() {
        loadDashboardData(this.value);
    });

    // Gestion des modales de validation/annulation
    $('#confirmValidateModal, #confirmCancelModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const transferId = button.data('transfer-id');
        const modal = $(this);
        modal.find('.modal-footer #confirmValidate, .modal-footer #confirmCancel').data('transfer-id', transferId);
    });

    // Validation d'un transfert
    $('#confirmValidate').on('click', function() {
        const transferId = $(this).data('transfer-id');
        const validationDate = $('#valid-date').val();
        $.ajax({
            url: '/api/transfers/validate',
            method: 'POST',
            data: { id: transferId, validationDate: validationDate },
            success: function(response) {
                $('#confirmValidateModal').modal('hide');
                loadDashboardData($('#dateSelector').val());
            },
            error: function(xhr, status, error) {
                console.error("Erreur lors de la validation:", error);
                alert("Une erreur est survenue lors de la validation.");
            }
        });
    });

    // Annulation d'un transfert
    $('#confirmCancel').on('click', function() {
        const transferId = $(this).data('transfer-id');
        $.ajax({
            url: '/api/transfers/cancel',
            method: 'POST',
            data: { id: transferId },
            success: function(response) {
                $('#confirmCancelModal').modal('hide');
                loadDashboardData($('#dateSelector').val());
            },
            error: function(xhr, status, error) {
                console.error("Erreur lors de l'annulation:", error);
                alert("Une erreur est survenue lors de l'annulation.");
            }
        });
    });
});
