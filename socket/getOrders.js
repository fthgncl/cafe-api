const Orders = require('../database/models/Orders');
const Users = require('../database/models/Users');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getOrders(socket, {type, token}) {
    try {

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        // 1. 'Beklemede' ve 'Hazırlanıyor' durumundaki siparişler, ödeme durumu 'İptal Edildi' olanları hariç tutun
        const pendingAndPreparingOrders = await Orders.find({
            kitchenStatus: { $in: ['Beklemede', 'Hazırlanıyor'] },
            paymentStatus: { $ne: 'İptal Edildi' } // 'İptal Edildi' olan siparişleri hariç tut
        });

        // 2. 'Ödendi' ve 'Hazırlandı' olan siparişler, son 1 saat içinde güncellenmiş
        const paidAndCompletedOrders = await Orders.find({
            paymentStatus: 'Ödendi',
            kitchenStatus: 'Hazırlandı',
            updatedDate: { $gte: oneHourAgo }
        });

        // 3. 'İptal Edildi' olan siparişler, son 1 saat içinde oluşturulmuş
        const cancelledOrders = await Orders.find({
            paymentStatus: 'İptal Edildi',
            createdDate: { $gte: oneHourAgo }
        });

        // 4. 'Daha Sonra Ödenecek' olan siparişler
        const pendingPaymentOrders = await Orders.find({
            paymentStatus: 'Daha Sonra Ödenecek'
        });

        // Sonuçları birleştir
        let orders = [
            ...pendingAndPreparingOrders,
            ...paidAndCompletedOrders,
            ...cancelledOrders,
            ...pendingPaymentOrders
        ];


        const hasPaymentProcessRole = await checkUserRoles(token.id, ['payment_processing']);
        const hasorderHandlingRole = await checkUserRoles(token.id, ['order_handling']);
        orders = await Promise.all(orders.map(async order => {

            const orderObject = order.toObject ? order.toObject() : order;

            if (!hasPaymentProcessRole) {
                delete orderObject.discount;
                delete orderObject.discountedPrice;
                delete orderObject.totalPrice;
                delete orderObject.paymentStatus;
            }

            if (!hasorderHandlingRole) {
                delete orderObject.kitchenStatus;
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
