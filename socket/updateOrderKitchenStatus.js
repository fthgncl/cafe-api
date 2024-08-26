const Orders = require('../database/models/Orders');
const {sendSocketMessage,sendMessageToAllClients} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");
const {updatedOrderKitchenStatustStatus} = require("../helper/salesControl");

async function updateOrderKitchenStatus(socket, {message, type, tokenData}) {
    try {
        const permissionsControlResult = await updateOrderPaymentStatusPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        Orders.findById(message.orderId)
            .then(order => {
                if (order && order.paymentStatus !== 'İptal Edildi') {

                    const oldKitchenStatus = order.kitchenStatus;
                    const newKitchenStatus = message.kitchenStatus;
                    const paymentStatus = order.paymentStatus;
                    updatedOrderKitchenStatustStatus({...order._doc},oldKitchenStatus,newKitchenStatus,paymentStatus)

                    return Orders.findByIdAndUpdate(message.orderId, { kitchenStatus: message.kitchenStatus }, { new: true });
                } else if (order) {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Sipariş iptal edilmiş. Güncelleme yapılamadı.'
                    });
                } else {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Sipariş numarası veritabanıyla eşleşmedi.'
                    });
                }
            })
            .then(updatedOrder => {
                if (updatedOrder) {
                    sendMessageToAllClients(type, {
                        status: 'success',
                        message: 'Siparişin mutfak durumu güncellendi.',
                        orderInfo: {
                            id: updatedOrder.id,
                            newKitchenStatus: updatedOrder.kitchenStatus
                        }
                    });
                }
            })
            .catch(error => {
                if (error.message !== 'Sipariş iptal edildi, güncelleme yapılmadı.' && error.message !== 'Sipariş bulunamadı.') {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Sipariş güncellenirken veritabanında hata oluştu.',
                        error: error.message
                    });
                }
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
