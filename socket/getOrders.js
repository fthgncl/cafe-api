const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getOrders(socket, { type, tokenData }) {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const formattedOneHourAgo = oneHourAgo.toISOString().slice(0, 19).replace('T', ' ');

        // Veritabanı sorgusunu optimize et
        const ordersQuery = `
            SELECT * 
            FROM orders 
            WHERE createdDate > ? 
                OR paymentStatus = 'Daha Sonra Ödenecek' 
                OR (paymentStatus <> 'İptal Edildi' AND kitchenStatus IN ('Beklemede', 'Hazırlanıyor'))
        `;
        const savedOrders = await connection.queryAsync(ordersQuery, [formattedOneHourAgo]);

        if (savedOrders.length === 0) {
            sendSocketMessage(socket, type, {
                status: 'success',
                message: 'Gösterilecek sipariş bulunamadı',
                orders: []
            });
            return;
        }

        // Siparişlerin içeriğini almak için sorgu
        const orderIds = savedOrders.map(order => order.id);
        const orderItemsQuery = `SELECT * FROM order_items WHERE orderId IN (?)`;
        const orderItems = await connection.queryAsync(orderItemsQuery, [orderIds]);

        // Ürün bilgilerini almak için sorgu
        const productIds = [...new Set(orderItems.map(item => item.productId))];
        const productsQuery = `SELECT id, productName FROM products WHERE id IN (?)`;
        const products = await connection.queryAsync(productsQuery, [productIds]);

        // Ürünleri bir map'e çevir
        const productMap = new Map(products.map(product => [product.id, product.productName]));

        // Kullanıcıları topluca al
        const userIds = savedOrders.map(order => order.userId);
        const usersQuery = 'SELECT * FROM users WHERE id IN (?)';
        const users = await connection.queryAsync(usersQuery, [userIds]);

        const userMap = new Map(users.map(user => [user.id.toString(), user]));

        const hasPaymentProcessRole = await checkUserRoles(tokenData.id, ['order_entry', 'payment_processing', 'discount_application']);
        const hasOrderHandlingRole = await checkUserRoles(tokenData.id, ['order_handling']);

        // Siparişleri işleyin
        const orders = savedOrders.map(order => {
            const orderObject = { ...order };

            if (!hasPaymentProcessRole) {
                delete orderObject.discount;
                delete orderObject.discountedPrice;
                delete orderObject.totalPrice;
                delete orderObject.paymentStatus;
            }

            if (!hasOrderHandlingRole) {
                delete orderObject.kitchenStatus;
            }

            const userId = orderObject.userId ? orderObject.userId.toString() : null;
            const createdUser = userId ? userMap.get(userId) : null;
            const items = orderItems
                .filter(item => item.orderId === orderObject.id)
                .map(item => ({
                    ...item,
                    productName: productMap.get(item.productId) || 'Ürün bulunamadı'
                }));

            return {
                ...orderObject,
                createdBy: createdUser ? `${createdUser.firstname} ${createdUser.lastname}` : 'Bilinmiyor',
                items
            };
        });

        sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Siparişler başarıyla listelendi',
            orders
        });

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Siparişler listelenirken hata oluştu.',
            error: error.message
        });
        console.error('Siparişler listelenirken hata oluştu : ', error);
    }
}


module.exports = getOrders;
