const { sendSocketMessage, sendMessageToAllClients } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");
const { updatedOrderKitchenStatustStatus } = require("../helper/salesControl");
const { connection } = require('../database/database');

async function updateOrderKitchenStatus(socket, { message, type, tokenData }) {
    try {
        const permissionsControlResult = await updateOrderPaymentStatusPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        // Siparişi orderId'ye göre veritabanından al
        const selectOrderQuery = 'SELECT * FROM orders WHERE id = ?';
        const orderResult = await connection.queryAsync(selectOrderQuery, [message.orderId]);

        if (orderResult.length > 0) {
            const order = orderResult[0];

            if (order.paymentStatus !== 'İptal Edildi') {
                const oldKitchenStatus = order.kitchenStatus;
                const newKitchenStatus = message.kitchenStatus;
                const paymentStatus = order.paymentStatus;

                // Mutfak durumu güncellemesini gerçekleştir
                updatedOrderKitchenStatustStatus({ ...order }, oldKitchenStatus, newKitchenStatus, paymentStatus);

                const updateOrderQuery = 'UPDATE orders SET kitchenStatus = ? WHERE id = ?';
                await connection.queryAsync(updateOrderQuery, [message.kitchenStatus, message.orderId]);

                // Güncellenmiş sipariş bilgisi ile tüm istemcilere mesaj gönder
                sendMessageToAllClients(type, {
                    status: 'success',
                    message: 'Siparişin mutfak durumu güncellendi.',
                    orderInfo: {
                        id: order.id,
                        newKitchenStatus: message.kitchenStatus
                    }
                });
            } else {
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Sipariş iptal edilmiş. Güncelleme yapılamadı.'
                });
            }
        } else {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Sipariş numarası veritabanıyla eşleşmedi.'
            });
        }

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş mutfak durumu güncellenirken hata oluştu.',
            error: error.message
        });
        console.error('Sipariş mutfak durumu güncellenirken hata: ', error);
    }
}

async function updateOrderPaymentStatusPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['order_handling']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Siparişin mutfak durumunu güncellemek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Siparişin mutfak durumunu güncellemek için yeterli yetkiye sahipsiniz.'
        };

    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = updateOrderKitchenStatus;
