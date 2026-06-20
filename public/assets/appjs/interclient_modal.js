(function () {
    const INTERCOMPTE_LABEL = 'transfert-intercompte';

    let senderBalance = null;
    let receiverBalance = null;
    let senderDisplayName = '';
    let receiverDisplayName = '';
    let editMode = false;
    let editingTransactionId = null;
    let editingCurrentAmount = 0;
    let onSuccessCallback = null;

    function formatInterclientAmount(value, currency) {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ' + currency;
    }

    function getDefaultSenderMotif() {
        return receiverDisplayName ? 'Transfert vers ' + receiverDisplayName : '';
    }

    function getDefaultReceiverMotif() {
        return senderDisplayName ? 'Transfert de ' + senderDisplayName : '';
    }

    function initInterclientReceiverSelect2() {
        const $select = $('#transfertInterclientReceiver');
        if (!$select.length || typeof $select.select2 !== 'function') {
            return;
        }
        if ($select.hasClass('select2-hidden-accessible')) {
            $select.select2('destroy');
        }
        $select.select2({
            placeholder: '— Sélectionner —',
            allowClear: true,
            width: '100%',
            minimumResultsForSearch: 0,
            dropdownParent: $('#modalTransfertInterclient'),
            language: 'fr'
        });
    }

    function setReceiverSelectDisabled(disabled) {
        const $select = $('#transfertInterclientReceiver');
        $select.prop('disabled', disabled);
        if ($select.hasClass('select2-hidden-accessible')) {
            $select.trigger('change.select2');
        }
    }

    function setModalMode(isEdit) {
        editMode = isEdit;
        if (isEdit) {
            $('#modalTransfertInterclientLabel').html(
                '<i class="bi bi-pencil-square me-2"></i>Modifier ' + INTERCOMPTE_LABEL
            );
            $('#interclientSubmitBtnLabel').text('Enregistrer les modifications');
            setReceiverSelectDisabled(true);
        } else {
            $('#modalTransfertInterclientLabel').html(
                '<i class="bi bi-arrow-left-right me-2"></i>' + INTERCOMPTE_LABEL
            );
            $('#interclientSubmitBtnLabel').text('Effectuer le transfert');
            $('#transfertInterclientEditId').val('');
            editingTransactionId = null;
            editingCurrentAmount = 0;
            setReceiverSelectDisabled(false);
        }
    }

    function toggleClearableFieldUi($input) {
        const $wrap = $input.closest('.interclient-clearable-field');
        $wrap.toggleClass('has-value', !!$input.val());
        $wrap.toggleClass('interclient-motif-default', $input.attr('data-is-default') === 'true');
    }

    function setClearableField($input, value, isDefault) {
        $input.val(value);
        $input.attr('data-is-default', isDefault ? 'true' : 'false');
        toggleClearableFieldUi($input);
    }

    function updateInterclientDefaultMotifs() {
        if (editMode) return;

        const $senderMotif = $('#interclientSenderMotif');
        const $receiverMotif = $('#interclientReceiverMotif');

        if ($senderMotif.attr('data-is-default') === 'true' || !$senderMotif.val()) {
            const defaultSender = getDefaultSenderMotif();
            setClearableField($senderMotif, defaultSender, !!defaultSender);
        }

        if ($receiverMotif.attr('data-is-default') === 'true' || !$receiverMotif.val()) {
            const defaultReceiver = getDefaultReceiverMotif();
            setClearableField($receiverMotif, defaultReceiver, !!defaultReceiver);
        }
    }

    function resetInterclientMotifs() {
        setClearableField($('#interclientSenderMotif'), '', false);
        setClearableField($('#interclientReceiverMotif'), '', false);
    }

    function syncInterclientPreviews() {
        const currency = $('#deviseInterclient').val() || 'CFA';
        const amount = parseFloat($('#transfertInterclientAmount').val()) || 0;

        $('#interclientSenderAmountPreview').text('− ' + formatInterclientAmount(amount, currency));
        $('#interclientReceiverAmountPreview').text('+ ' + formatInterclientAmount(amount, currency));

        let baseSender = senderBalance;
        let baseReceiver = receiverBalance;

        if (editMode && editingCurrentAmount > 0) {
            if (baseSender !== null) baseSender += editingCurrentAmount;
            if (baseReceiver !== null) baseReceiver -= editingCurrentAmount;
        }

        if (baseSender !== null) {
            const afterSender = baseSender - amount;
            const senderClass = afterSender < 0 ? 'text-danger' : 'text-dark';
            $('#soldeInterclientSenderAfter')
                .removeClass('text-danger text-dark text-success')
                .addClass(senderClass)
                .text(formatInterclientAmount(afterSender, currency));
        } else {
            $('#soldeInterclientSenderAfter').text('—');
        }

        if (baseReceiver !== null) {
            const afterReceiver = baseReceiver + amount;
            $('#soldeInterclientReceiverAfter')
                .removeClass('text-danger text-dark text-success')
                .addClass('text-success')
                .text(formatInterclientAmount(afterReceiver, currency));
        } else {
            $('#soldeInterclientReceiverAfter').text('—');
        }
    }

    function loadInterclientSenderSolde(senderId, currency) {
        if (!senderId || !currency) return;
        $.get(`/api/client/${senderId}/stats/${currency}`, function (data) {
            senderBalance = parseFloat(data.balance) || 0;
            $('#soldeInterclientSender').text(formatInterclientAmount(senderBalance, currency));
            syncInterclientPreviews();
        }).fail(function () {
            senderBalance = null;
            $('#soldeInterclientSender').text('—');
            syncInterclientPreviews();
        });
    }

    function loadInterclientReceiverSolde(receiverId, currency) {
        if (!receiverId || !currency) {
            receiverBalance = null;
            $('#soldeInterclientReceiver').text('—');
            syncInterclientPreviews();
            return;
        }
        $.get(`/api/client/${receiverId}/stats/${currency}`, function (data) {
            receiverBalance = parseFloat(data.balance) || 0;
            $('#soldeInterclientReceiver').text(formatInterclientAmount(receiverBalance, currency));
            syncInterclientPreviews();
        }).fail(function () {
            receiverBalance = null;
            $('#soldeInterclientReceiver').text('—');
            syncInterclientPreviews();
        });
    }

    function refreshInterclientSoldes() {
        const currency = $('#deviseInterclient').val();
        const senderId = $('#transfertInterclientSenderId').val();
        const receiverId = $('#transfertInterclientReceiver').val();
        loadInterclientSenderSolde(senderId, currency);
        loadInterclientReceiverSolde(receiverId, currency);
    }

    function bindClearableMotifFields() {
        $('#interclientSenderMotif, #interclientReceiverMotif')
            .off('input.interclient')
            .on('input.interclient', function () {
                $(this).attr('data-is-default', 'false');
                toggleClearableFieldUi($(this));
            });

        $('.interclient-field-clear')
            .off('click.interclient')
            .on('click.interclient', function (e) {
                e.preventDefault();
                const $input = $($(this).data('target'));
                setClearableField($input, '', false);
                $input.trigger('focus');
            });
    }

    window.populateInterclientReceivers = function (senderId, selectedReceiverId, callback) {
        const $select = $('#transfertInterclientReceiver');
        $select.find('option:not(:first)').remove();
        $.get('/api/clients', function (response) {
            (response.data || []).forEach(function (client) {
                if (String(client.id) !== String(senderId)) {
                    $select.append(`<option value="${client.id}">${client.nomComplet}</option>`);
                }
            });
            if (selectedReceiverId) {
                $select.val(String(selectedReceiverId));
                const $selected = $select.find(':selected');
                receiverDisplayName = $selected.val() ? $selected.text() : '';
            } else {
                $select.val('');
            }
            $select.trigger('change');
            if (typeof callback === 'function') callback();
        });
    };

    window.openInterclientModal = function (senderId, senderName) {
        setModalMode(false);
        onSuccessCallback = null;

        $('#transfertInterclientSenderId').val(senderId);
        $('#transfertInterclientAmount').val('');
        $('#transfertInterclientReceiver').val('').trigger('change');
        $('#transfertInterclientDate').val(new Date().toISOString().slice(0, 10));

        receiverDisplayName = '';
        resetInterclientMotifs();

        senderBalance = null;
        receiverBalance = null;
        $('#soldeInterclientSender, #soldeInterclientReceiver').text('—');
        $('#soldeInterclientSenderAfter, #soldeInterclientReceiverAfter').text('—');
        syncInterclientPreviews();

        if (senderName) {
            senderDisplayName = senderName;
            $('#interclientSenderName').text(senderName);
            updateInterclientDefaultMotifs();
        } else {
            senderDisplayName = '';
            $('#interclientSenderName').text('…');
            $.get(`/api/client/${senderId}/smalldetails`, function (data) {
                senderDisplayName = data.nomComplet || '';
                $('#interclientSenderName').text(senderDisplayName || '—');
                updateInterclientDefaultMotifs();
            }).fail(function () {
                senderDisplayName = '';
                $('#interclientSenderName').text('—');
            });
        }

        populateInterclientReceivers(senderId, null, function () {
            refreshInterclientSoldes();
        });
        $('#modalTransfertInterclient').modal('show');
    };

    window.openInterclientEditModal = function (transactionId) {
        $.get(`/api/transaction/${transactionId}/details`, function (data) {
            if (!data.isInterClient || !data.senderClient || !data.receiverClient) {
                showToastModal({ message: 'Impossible de charger le transfert-intercompte', type: 'error' });
                return;
            }

            setModalMode(true);
            editingTransactionId = transactionId;
            editingCurrentAmount = parseFloat(data.montant) || 0;
            $('#transfertInterclientEditId').val(transactionId);

            senderDisplayName = data.senderClient.nomComplet;
            receiverDisplayName = data.receiverClient.nomComplet;

            $('#transfertInterclientSenderId').val(data.senderClient.id);
            $('#interclientSenderName').text(senderDisplayName);
            $('#transfertInterclientAmount').val(data.montant);
            $('#deviseInterclient').val(data.currency || 'CFA');
            $('#transfertInterclientDate').val(data.date);

            setClearableField($('#interclientSenderMotif'), data.senderNote || '', false);
            setClearableField($('#interclientReceiverMotif'), data.receiverNote || '', false);

            populateInterclientReceivers(data.senderClient.id, data.receiverClient.id, function () {
                refreshInterclientSoldes();
                syncInterclientPreviews();
                $('#modalTransfertInterclient').modal('show');
            });
        }).fail(function () {
            showToastModal({ message: 'Erreur lors du chargement du transfert', type: 'error' });
        });
    };

    window.bindInterclientModalEvents = function (options) {
        options = options || {};
        onSuccessCallback = options.onSuccess || null;

        bindClearableMotifFields();
        initInterclientReceiverSelect2();

        $('#deviseInterclient').off('change.interclient').on('change.interclient', function () {
            refreshInterclientSoldes();
        });

        $('#transfertInterclientAmount').off('input.interclient').on('input.interclient', function () {
            syncInterclientPreviews();
        });

        $('#transfertInterclientReceiver').off('change.interclient').on('change.interclient', function () {
            if (editMode) return;
            const $selected = $(this).find(':selected');
            receiverDisplayName = $(this).val() ? $selected.text() : '';
            const receiverId = $(this).val();
            const currency = $('#deviseInterclient').val();
            loadInterclientReceiverSolde(receiverId, currency);
            updateInterclientDefaultMotifs();
        });

        $('#form-transfert-interclient').off('submit.interclient').on('submit.interclient', function (e) {
            e.preventDefault();
            const $form = $(this);
            const $btn = $form.find('button[type="submit"]');
            if ($btn.prop('disabled')) return;
            $btn.prop('disabled', true);

            const payload = {
                amount: $('#transfertInterclientAmount').val(),
                senderNote: $('#interclientSenderMotif').val(),
                receiverNote: $('#interclientReceiverMotif').val(),
                date: $('#transfertInterclientDate').val(),
                currency: $('#deviseInterclient').val()
            };

            let request;
            if (editMode && editingTransactionId) {
                request = $.post('/api/transaction/' + editingTransactionId + '/update', payload);
            } else {
                const senderId = $('#transfertInterclientSenderId').val();
                payload.receiverId = $('#transfertInterclientReceiver').val();
                request = $.post(`/dashboard/client/${senderId}/transfert-interclient`, payload);
            }

            request
                .done(function (response) {
                    const msg = editMode
                        ? 'Transfert-intercompte modifié avec succès'
                        : 'Transfert-intercompte effectué !';
                    showToastModal({ message: msg, type: 'success' });
                    $('#modalTransfertInterclient').modal('hide');
                    if (typeof onSuccessCallback === 'function') {
                        onSuccessCallback(response);
                    }
                })
                .fail(function (xhr) {
                    const msg = xhr.responseJSON?.error || xhr.responseJSON?.message || 'Erreur lors de l\'opération';
                    showToastModal({ message: msg, type: 'error' });
                })
                .always(function () {
                    $btn.prop('disabled', false);
                });
        });
    };

    window.isIntercompteOperation = function (operationOrType) {
        return operationOrType === INTERCOMPTE_LABEL;
    };
})();
