const Orders = require('../database/models/Orders');
const Users = require('../database/models/Users');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getOrders(socket, {type, token}) {
    try {
        // Beklemede olan siparişleri al
        const pendingOrders = await Orders.find({ kitchenStatus: 'Beklemede' });

        // Son 1 saatlik siparişleri al, "Beklemede" dışında
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentOrders = await Orders.find({
            createdDate: { $gte: oneHourAgo },
            kitchenStatus: { $ne: 'Beklemede' }  // "Beklemede" olmayanları seç
        });

        // Sonuçları birleştir
        let orders = [
            ...pendingOrders,
            ...recentOrders
        ];

        const hasPaymentProcessRole = await checkUserRoles(token.id, ['payment_processing']);
        orders = await Promise.all(orders.map(async order => {

            const orderObject = order.toObject ? order.toObject() : order;

            if (!hasPaymentProcessRole) {
                delete orderObject.discount;
                delete orderObject.discountedPrice;
                delete orderObject.totalPrice;
                delete orderObject.paymentStatus;
            }

            const createdUser = await Users.findById(orderObject.user);
            return {
                ...orderObject,
                createdBy: `${createdUser.firstname} ${createdUser.lastname}`
            };
        }));

        
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
