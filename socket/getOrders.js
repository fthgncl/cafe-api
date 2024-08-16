const Orders = require('../database/models/Orders');
const {sendSocketMessage} = require("../helper/socket");

async function getOrders(socket, {message, type, token}) {
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
        const orders = {
            ...pendingOrders,
            ...recentOrders
        };

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
