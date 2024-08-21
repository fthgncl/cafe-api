const Orders = require('../database/models/Orders');
const {sendSocketMessage,sendMessageToAllClients} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function updateOrderKitchenStatus(socket, {message, type, token}) {
    try {
        const permissionsControlResult = await updateOrderPaymentStatusPermissionsControl(token);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        Orders.findByIdAndUpdate(message.orderId, {kitchenStatus:message.kitchenStatus}, {new:true})
            .then(updatedOrder => {


                if (updatedOrder) {
                    sendMessageToAllClients(type, {
                        status: 'success',
                        message: 'Siparişin mutfak durumu güncellendi.',
                        orderInfo : {
                            id : updatedOrder.id,
                            newKitchenStatus : updatedOrder.kitchenStatus
                        }
                    });
                } else {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Sipariş numarası veritabanıyla eşleşmedi.'
                    });
                }
            })
            .catch(error => {
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Sipariş güncellenirken veritabanında hata oluştu.',
                    error: error.message
                });
                console.error('Güncelleme sırasında bir hata oluştu:', error);
            });

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş mutfak durumu güncellenirken hata oluştu.',
            error: error.message
        });
        console.error('Sipariş mutfak durumu güncellenirken hata : ', error);
    }
}

async function updateOrderPaymentStatusPermissionsControl(token) {
    try {
        const hasRequiredRoles = await checkUserRoles(token.id, ['order_handling']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Siparişin mutfak durumunu güncellemek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Siparişin mutfak durumunu güncellemek için yeterli yetkiye sahipsiniz.'
        }

    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = updateOrderKitchenStatus;
