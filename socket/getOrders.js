const Orders = require('../database/models/Orders');
const Users = require('../database/models/Users');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getOrders(socket, { type, tokenData }) {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // Veritabanı sorgusunu optimize et
        const ordersQuery = Orders.find({
            $or: [
                { createdDate: { $gt: oneHourAgo } },
                { paymentStatus: 'Daha Sonra Ödenecek' },
                {
                    paymentStatus: { $ne: 'İptal Edildi' },
                    kitchenStatus: { $in: ['Beklemede', 'Hazırlanıyor'] }
                }
            ]
        });

        const savedOrders = await ordersQuery;

        // Kullanıcıları topluca al
        const userIds = savedOrders.map(order => order.user);
        const users = await Users.find({ _id: { $in: userIds } });
        const userMap = new Map(users.map(user => [user._id.toString(), user]));

        const hasPaymentProcessRole = await checkUserRoles(tokenData.id, ['order_entry','payment_processing','discount_application']);
        const hasOrderHandlingRole = await checkUserRoles(tokenData.id, ['order_handling']);

        // Siparişleri işleyin
        const orders = savedOrders.map(order => {
            const orderObject = order.toObject();

            if (!hasPaymentProcessRole) {
                delete orderObject.discount;
                delete orderObject.discountedPrice;
                delete orderObject.totalPrice;
                delete orderObject.paymentStatus;
            }

            if (!hasOrderHandlingRole) {
                delete orderObject.kitchenStatus;
            }

            const createdUser = userMap.get(orderObject.user.toString());
            return {
                ...orderObject,
                createdBy: createdUser ? `${createdUser.firstname} ${createdUser.lastname}` : 'Bilinmiyor'
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
