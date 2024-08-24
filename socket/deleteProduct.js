const Products = require('../database/models/Products');
const {sendSocketMessage, sendMessageToAllClients} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function deleteProduct(socket, {message, type, tokenData}) {
    try {
        const permissionsControlResult = await deleteProductPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        console.log(message);

        Products.findByIdAndDelete(message.productId)
            .then(doc => {
                if (!doc) {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Ürün bulunamadı'
                    });
                } else {
                    sendMessageToAllClients(type, {
                        status: 'success',
                        message: 'Ürün silindi',
                        deletedProductId: message.productId
                    });
                }
            })
            .catch(error => {
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Ürün silinirken veritabanında hata oluştu.',
                    error: error.message
                });
                console.error('Ürün silinirken veritabanında hata oluştu:', error);
            });


    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı silinirken hata oluştu.',
            error: error.message
        });
        console.error('Kullanıcı silinirken hata : ', error);
    }
}

async function deleteProductPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['admin']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Ürün silmek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Ürün silmek için yeterli yetkiye sahipsiniz.'
        }

    } catch (error) {
        return {
            status: 'error',
            message: 'Ürün silme işlemi için yetki kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = deleteProduct;
