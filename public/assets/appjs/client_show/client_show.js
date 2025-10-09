$(document).ready(function () {
  const clientId = extractClientId();

  loadClientSoldes(clientId); 
  initTransactions(clientId);
  initTransactionsForm(clientId);
  initTranferts(clientId);
  initTransfertsForm(clientId);
});
