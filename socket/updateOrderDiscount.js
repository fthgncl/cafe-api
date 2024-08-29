const Orders = require('../database/models/Orders');
const {sendSocketMessage, sendMessageToAllClients} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function updateOrderDiscount(socket, {message, type, tokenData}) {
    try {
        const permissionsControlResult = await updateOrderDiscountPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }
        console.log(message);
        const {discount, orderId} = message;

        if (typeof discount === 'undefined' || discount === null || typeof orderId === 'undefined' || orderId === null) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Parametreler tanımlı değil ( discount veya orderId )',
            });
            return;
        }

        if (discount < 0 || discount > 100) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'discount parametresi 0-100 aralığında olmalıdır',
            });
            return;
        }

        Orders.findById(message.orderId)
            .then(order => {
                if (order) {

                    const updateProps = {
                        discount,
                        discountedPrice: order.totalPrice - order.totalPrice * discount / 100
                    }

                    Orders.findByIdAndUpdate(message.orderId, updateProps, {new: true})
                        .then(updatedOrder => {
                            if (updatedOrder) {
                                sendMessageToAllClients(type, {
                                    status: 'success',
                                    message: 'İndirim başarıyla uygulandı.',
                                    orderId,
                                    newPrices: updateProps
                                });
                            }
                        })
                        .catch(error => {
                            sendSocketMessage(socket, type, {
                                status: 'error',
                                message: 'İndirim yapılırken hata oluştu.',
                                error
                            })
                        })

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

async function updateOrderDiscountPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['discount_application']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Siparişin indirim durumunu için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Siparişin indirim durumunu güncellemek için yeterli yetkiye sahipsiniz.'
        }

    } catch (error) {
        return {
            status: 'error',
            message: 'Siparişin indirim durumunu güncellenirken bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = updateOrderDiscount;
