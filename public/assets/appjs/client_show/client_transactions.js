function initTransactions(clientId) {
  $("#filterTransactionType").on("change", () =>
    transactionsTable.ajax.reload(),
  );
  $("#filterTransactionDate").daterangepicker({
    locale: {
      format: "YYYY-MM-DD",
      applyLabel: "Appliquer",
      cancelLabel: "Annuler",
      daysOfWeek: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
      monthNames: [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre",
      ],
      firstDay: 1,
    },
    autoUpdateInput: false,
    opens: "right",
  });

  let startTransactionDate = null;
  let endTransactionDate = null;

  $("#filterTransactionDate").on(
    "apply.daterangepicker",
    function (ev, picker) {
      $(this).val(
        picker.startDate.format("YYYY-MM-DD") +
          " - " +
          picker.endDate.format("YYYY-MM-DD"),
      );
      startTransactionDate = picker.startDate.format("YYYY-MM-DD");
      endTransactionDate = picker.endDate.format("YYYY-MM-DD");
      transactionsTable.ajax.reload();
    },
  );

  $("#filterTransactionDate").on(
    "cancel.daterangepicker",
    function (ev, picker) {
      $(this).val("");
      startTransactionDate = null;
      endTransactionDate = null;
      transactionsTable.ajax.reload();
    },
  );

  const transactionsTable = $("#transactionsTable").DataTable({
    dom: "Bflrtip",
    buttons: [
      {
        text: '<i class="bi bi-eye"></i> Apercu',
        className: "btn btn-info",
        action: function (e, dt, node, config) {
          ViewTransactionReport(clientId);
        },
      },
      {
        text: '<i class="bi bi-printer"></i> Imprimer',
        className: "btn btn-primary",
        action: function (e, dt, node, config) {
          printTransactionReport(clientId);
        },
      },
    ],
    ajax: {
      url: `/api/client/${clientId}/transactions`,
      data: (d) => {
        d.type = $("#filterTransactionType").val();
        d.dateFrom = startTransactionDate;
        d.dateTo = endTransactionDate;
      },
    },
    columns: [
      {
        data: "id",
        visible: false,
        searchable: false,
      },
      {
        data: "id",
        title: "Reference",
        render: (data) => {
          return "BSS-C" + String(data).padStart(3, "0");
        },
      },
      {
        data: "date",
        title: "Date",
        render: (data) => {
          return data.split(" ")[0];
        },
      },
      {
        data: "description",
        title: "Description",
      },
      {
        data: "amountCFA",
        title: "CFA",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
      },
      {
        data: "amountAED",
        title: "AED",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountEUR",
        title: "EUR",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountUSD",
        title: "USD",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountGBP",
        title: "GBP",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountCNY",
        title: "CNY",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountMAD",
        title: "MAD",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount > 0 ? amount.toLocaleString() : "--";
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: "amountDZD",
        title: "DZD",
        render: function (data) {
          if (data === null) return '<span class="text-muted">0.00</span>';
          const amount = parseFloat(data);
          const formattedAmount = amount.toLocaleString();
          const colorClass = amount < 0 ? "text-danger" : "text-success";
          return `<span class="fw-bold ${colorClass}">${formattedAmount}</span>`;
        },
        visible: false,
      },
      {
        data: null,
        title: "Actions",
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
            return "";
          }
        },
        orderable: false,
      },
    ],
    order: [[0, "desc"]],
    language: { url: "/api/datatable_json_fr" },
  });

  let transactionReportZoom = 1;

  function applyTransactionReportZoom() {
    $("#transactionReportZoomValue").text(`${Math.round(transactionReportZoom * 100)}%`);
    $("#transactionReportScaleTarget").css({
      transform: `scale(${transactionReportZoom})`,
      transformOrigin: "top center",
    });
  }

  function getTransactionReportData(clientId) {
    const dateFrom = startTransactionDate;
    const dateTo = endTransactionDate;

    return Promise.all([
      fetch(`/api/client/${clientId}/smalldetails`).then((r) => r.json()),
      fetch(
        `/api/client/${clientId}/transactions_report?dateFrom=${encodeURIComponent(dateFrom || "")}&dateTo=${encodeURIComponent(dateTo || "")}`,
      ).then((r) => r.json()),
    ]).then(([clientData, transactionsData]) => ({
      clientData,
      transactionsData,
      dateFrom,
      dateTo,
    }));
  }

  function buildTransactionReportContent({
    clientData,
    transactionsData,
    dateFrom,
    dateTo,
  }) {
    const currentDate = new Date().toLocaleDateString("fr-FR");
    let transactionsHTML = "";
    const solde = Number(transactionsData.solde || 0);

    transactionsData.data.forEach((transaction) => {
      transactionsHTML += `
        <tr>
          <td>BSS-C${String(transaction.id).padStart(3, "0")}</td>
          <td>${transaction.date.split(" ")[0]}</td>
          <td>${transaction.description}</td>
          <td style="text-align: right;">${transaction.entree > 0 ? parseFloat(transaction.entree).toLocaleString("fr-FR") + " FCFA" : ""}</td>
          <td style="text-align: right;">${transaction.sortie > 0 ? parseFloat(transaction.sortie).toLocaleString("fr-FR") + " FCFA" : ""}</td>
          <td style="text-align: right;">${transaction.solde > 0 ? parseFloat(transaction.solde).toLocaleString("fr-FR") + " FCFA" : ""}</td>
        </tr>
      `;
    });

    let periodeText = "";
    if (!dateFrom && !dateTo) {
      periodeText = "Depuis le début";
    } else {
      periodeText = `Période du ${dateFrom || ""} au ${dateTo || ""}`;
    }

    const reportStyles = `
      .transaction-report-document {
        background: #fff;
        color: #000;
        font-family: Arial, sans-serif;
        font-size: 13px;
        line-height: 1.2;
        padding: 30px;
      }
      .transaction-report-document .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 5px;
        border-bottom: 2px solid #000;
        padding-bottom: 5px;
      }
      .transaction-report-document .header img {
        width: 80px;
        height: auto;
      }
      .transaction-report-document .company-info {
        text-align: right;
        font-size: 13px;
      }
      .transaction-report-document .title {
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin: 5px 0 10px;
        text-transform: uppercase;
      }
      .transaction-report-document .client-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 16px;
      }
      .transaction-report-document .transaction-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 16px;
        margin-bottom: 10px;
      }
      .transaction-report-document .transaction-table th,
      .transaction-report-document .transaction-table td {
        border: 1px solid #000;
        padding: 3px;
        text-align: left;
      }
      .transaction-report-document .transaction-table th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .transaction-report-document .footer {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        font-size: 16px;
      }
      .transaction-report-document .signature {
        text-align: center;
        margin-top: 20px;
        font-size: 16px;
      }
      .transaction-report-document .total-row {
        font-weight: bold;
        background-color: #f0f0f0;
      }
    `;

    const reportBody = `
      <div class="transaction-report-document">
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
            <strong>Téléphone:</strong> ${clientData.phoneNumber || "Non renseigné"}
          </div>
          <div>
            <strong>Adresse:</strong> ${clientData.address || "Non renseignée"}<br>
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
              <td style="text-align: right;">${solde.toLocaleString("fr-FR")} F CFA</td>
            </tr>
          </tbody>
        </table>

        <div class="signature">
          <p>Signature et cachet de l'entreprise</p>
          <p style="margin-top: 20px;">_________________________________</p>
        </div>

        <div class="footer">
          <div>BSS</div>
          <div>Page 1/1</div>
        </div>
      </div>
    `;

    return {
      title: `Relevé de Compte - ${clientData.nomComplet}`,
      reportStyles,
      reportBody,
    };
  }

  function ViewTransactionReport(clientId) {
    getTransactionReportData(clientId)
      .then((reportData) => {
        const report = buildTransactionReportContent(reportData);
        transactionReportZoom = 1;
        $("#transactionReportModalLabel").text(report.title);
        $("#transactionReportContent").html(
          `<style>${report.reportStyles}</style><div id="transactionReportScaleTarget">${report.reportBody}</div>`,
        );
        $("#transactionReportPrintBtn").data("clientId", clientId);
        applyTransactionReportZoom();
        $("#transactionReportModal").modal("show");
      })
      .catch((error) => {
        console.error("Erreur lors de la génération de l'aperçu:", error);
        alert("Erreur lors de la génération de l'aperçu du rapport");
      });
  }

  // Fonction d'impression du relevé de compte complet
  function printTransactionReport(clientId) {
    getTransactionReportData(clientId)
      .then((reportData) => {
        const report = buildTransactionReportContent(reportData);
        const printWindow = window.open("", "_blank", "width=800,height=600");

        if (!printWindow) {
          throw new Error("Fenêtre d'impression bloquée");
        }

        printWindow.document.write(`
            <!DOCTYPE html>
                <html>
                    <head>
                        <title>${report.title}</title>
                        <meta charset="UTF-8">
                <style>
                    @page {
                    size: A5 landscape;
                    margin: 30px;
                    }
                    body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    }
                    ${report.reportStyles}
                </style>
                </head>
                <body>
                ${report.reportBody}
                </body>
            </html>
    `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
          printWindow.print();
        };
      })
      .catch((error) => {
        console.error("Erreur lors de la génération du rapport:", error);
        alert("Erreur lors de la génération du rapport d'impression");
      });
  }

  $("#transactionReportZoomIn").on("click", function () {
    transactionReportZoom = Math.min(transactionReportZoom + 0.1, 2);
    applyTransactionReportZoom();
  });

  $("#transactionReportZoomOut").on("click", function () {
    transactionReportZoom = Math.max(transactionReportZoom - 0.1, 0.5);
    applyTransactionReportZoom();
  });

  $("#transactionReportPrintBtn").on("click", function () {
    const reportClientId = $(this).data("clientId");

    if (reportClientId) {
      printTransactionReport(reportClientId);
    }
  });

  transactionsTable.on("click", ".print-btn", function () {
    id = $(this).data("id");
    window.open(`/api/transaction/${id}/receipt`, "_blank");
  });

  transactionsTable.on("click", ".modify-btn", function () {
    selectedTransactionID = $(this).data("id");
    $.get(`/api/transaction/${selectedTransactionID}/details`, function (data) {
      $("#editTransDate").val(data.date);
      $("#editTransAmount").val(data.montant);
      $("#editTransType").val(data.type);
    });

    $("#editTransactionModal").modal("show");
  });

  ($("#confirmEditTrans").on("click", () => {
    $(this).prop("disabled", true);
    $.post(
      "/api/transaction/" + selectedTransactionID + "/update",
      {
        montant: $("#editTransAmount").val(),
        date: $("#editTransDate").val(),
      },
      () => {
        transactionsTable.ajax.reload();
        $("#editTransactionModal").modal("hide");
        showToastModal({
          message: "Transaction modifiée avec succès",
          type: "success",
        });
        $(this).prop("disabled", false);
      },
    ).fail(function () {
      showToastModal({ message: "Echec de modification", type: "error" });
      $(this).prop("disabled", false);
    });
  }),
    transactionsTable.on("click", ".cancel-btn", function () {
      selectedTransactionID = $(this).data("id");
      $("#confirmCancelTransactionModal").modal("show");
    }));

  $("#confirmCancelTransaction").on("click", () => {
    console.log(selectedTransactionID);
    $(this).prop("disabled", true);
    $.post(
      "/api/transaction/" + selectedTransactionID + "/cancel",
      { id: selectedTransactionID },
      () => {
        transactionsTable.ajax.reload();
        $("#confirmCancelTransactionModal").modal("hide");
        showToastModal({
          message: "Transaction supprimée avec succès",
          type: "success",
        });
        // Recharger soldes et autres tables
        try {
          loadClientSoldes(clientId);
        } catch (e) {}
        if ($.fn.DataTable && $.fn.DataTable.isDataTable("#opsTable")) {
          const _dt = $("#opsTable").DataTable();
          if (_dt.ajax && typeof _dt.ajax.reload === "function")
            _dt.ajax.reload();
        }
        if ($.fn.DataTable && $.fn.DataTable.isDataTable("#exchangesTable")) {
          const _ex = $("#exchangesTable").DataTable();
          if (_ex.ajax && typeof _ex.ajax.reload === "function")
            _ex.ajax.reload();
        }
        if ($.fn.DataTable && $.fn.DataTable.isDataTable("#transfersTable")) {
          const _tt = $("#transfersTable").DataTable();
          if (_tt.ajax && typeof _tt.ajax.reload === "function")
            _tt.ajax.reload();
        }
        $(this).prop("disabled", false);
      },
    ).fail(function () {
      showToastModal({ message: "Echec de suppression", type: "error" });
      $(this).prop("disabled", false);
    });
  });
}
