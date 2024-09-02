const { sendSocketMessage, sendMessageToAllClients } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");
const { connection } = require('../database/database');

async function updateOrderDiscount(socket, { message, type, tokenData }) {
    try {
        const permissionsControlResult = await updateOrderDiscountPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        const { discount, orderId } = message;

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

        // Siparişi orderId'ye göre veritabanından al
        const selectOrderQuery = 'SELECT * FROM orders WHERE id = ?';
        const orderResult = await connection.queryAsync(selectOrderQuery, [orderId]);

        if (orderResult.length > 0) {
            const order = orderResult[0];

            const updateProps = {
                discount,
                discountedPrice: order.totalPrice - order.totalPrice * discount / 100
            };

            // Siparişin indirim ve indirimli fiyat bilgisini güncelle
            const updateOrderQuery = 'UPDATE orders SET discount = ?, discountedPrice = ? WHERE id = ?';
            await connection.queryAsync(updateOrderQuery, [updateProps.discount, updateProps.discountedPrice, orderId]);

            sendMessageToAllClients(type, {
                status: 'success',
                message: 'İndirim başarıyla uygulandı.',
                orderId,
                newPrices: updateProps
            });

        } else {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Sipariş numarası veritabanıyla eşleşmedi.'
            });
        }

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş indirim durumu güncellenirken hata oluştu.',
            error: error.message
        });
        console.error('Sipariş indirim durumu güncellenirken hata: ', error);
    }
}

async function updateOrderDiscountPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['discount_application']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Siparişin indirim durumunu güncellemek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Siparişin indirim durumunu güncellemek için yeterli yetkiye sahipsiniz.'
        };

    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = updateOrderDiscount;
