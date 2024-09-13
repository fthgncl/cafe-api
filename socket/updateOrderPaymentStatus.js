const { sendSocketMessage, sendMessageToAllClients } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");
const { updatedOrderPaymentStatus } = require("./../helper/salesControl");
const { connection } = require('../database/database');

async function updateOrderPaymentStatus(socket, { message, type, tokenData }) {
    try {
        // Yetki kontrolü
        const permissionsControlResult = await updateOrderPaymentStatusPermissionsControl(tokenData);
        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        const { orderId, paymentStatus } = message;

        try {
            // Güncellenmeden önceki siparişi al
            const oldOrderData = await connection.queryAsync(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            );

            if (oldOrderData.length === 0) {
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Sipariş bulunamadı.'
                });
                return;
            }

            // Siparişi güncelle
            const updateResult = await connection.queryAsync(
                'UPDATE orders SET paymentStatus = ? WHERE id = ?',
                [paymentStatus, orderId]
            );

            if (updateResult.affectedRows === 0) {
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Sipariş numarası veritabanıyla eşleşmedi.'
                });
                return;
            }

            // Güncellenmiş siparişi tekrar sorgula
            const updatedOrderData = await connection.queryAsync(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            );

            const updatedOrder = updatedOrderData[0];
            const oldPaymentStatus = oldOrderData[0].paymentStatus;
            const newPaymentStatus = paymentStatus;
            const kitchenStatus = oldOrderData[0].kitchenStatus;

            await updatedOrderPaymentStatus(updatedOrder, oldPaymentStatus, newPaymentStatus, kitchenStatus);

            sendMessageToAllClients(type, {
                status: 'success',
                message: 'Siparişin ödeme durumu güncellendi.',
                updatedOrder
            });

        } catch (error) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Sipariş güncellenirken veritabanında hata oluştu.',
                error: error.message
            });
            console.error('Güncelleme sırasında bir hata oluştu:', error);
        }
    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş ödeme durumu güncellenirken hata oluştu.',
            error: error.message
        });
        console.error('Sipariş ödeme durumu güncellenirken hata : ', error);
    }
}

async function updateOrderPaymentStatusPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['payment_processing']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Sipariş ödeme durumunu güncellemek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Sipariş ödeme durumunu güncellemek için yeterli yetkiye sahipsiniz.'
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = updateOrderPaymentStatus;
