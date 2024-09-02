const { connection } = require('../database/database');
const { sendSocketMessage, sendMessageToAllClients } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function deleteProduct(socket, { message, type, tokenData }) {
    try {
        // Ürün silme işlemi için yetki kontrolü yap
        const permissionsControlResult = await deleteProductPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        const productId = message.productId;

        try {

            // Ürüne bağlı product_contents tablosundan kayıtları sil
            await connection.queryAsync(
                'DELETE FROM product_contents WHERE productId = ?',
                [productId]
            );


            // Ürüne bağlı product_sizes tablosundan kayıtları sil
            await connection.queryAsync(
                'DELETE FROM product_sizes WHERE productId = ?',
                [productId]
            );

            // Ürünü products tablosundan sil
            const deleteProductResult = await connection.queryAsync(
                'DELETE FROM products WHERE id = ?',
                [productId]
            );

            if (deleteProductResult.affectedRows === 0) {
                // Ürün bulunamadıysa hata mesajı gönder
                sendSocketMessage(socket, type, {
                    status: 'error',
                    message: 'Ürün bulunamadı'
                });
            } else {
                // Başarılı silme işlemi sonrasında tüm istemcilere mesaj gönder
                sendMessageToAllClients(type, {
                    status: 'success',
                    message: 'Bir ürün ve ona bağlı veriler silindi',
                    deletedProductId: productId
                });
            }

        } catch (err) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün veya ona bağlı veriler silinirken veritabanında hata oluştu.',
                error: err.message
            });
            console.error('Veritabanı işlemi sırasında hata oluştu:', err);
        }

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün silinirken bir hata oluştu.',
            error: error.message
        });
        console.error('Ürün silinirken hata oluştu:', error);
    }
}

// Ürün silme işlemi için yetki kontrolü
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
        };

    } catch (error) {
        return {
            status: 'error',
            message: 'Ürün silme işlemi için yetki kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = deleteProduct;
