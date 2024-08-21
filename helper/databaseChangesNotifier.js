const {sendMessageToAllClients} = require('./socket');
const GetProducts = require("../database/models/Products");
const Orders = require("../database/models/Orders");
const Users = require("../database/models/Users");

async function handleChangeProducts() {
    const messageType = 'getProducts';
    try {
        const products = await GetProducts.find();
        sendMessageToAllClients(messageType, {
            status: 'success',
            message: 'Ürün listesi başarıyla alındı.',
            products
        });
        return products;
    } catch (error) {
        console.error('Ürünler veri tabanından alınamadı:', error);
        throw error;
    }
}

async function handleNewOrder(orderId) {
    const messageType = 'newOrder';
    try {
        const newOrder = await Orders.findById(orderId);
        const createdUser = await Users.findById(newOrder.user)
        newOrder._doc.createdBy = createdUser ? `${createdUser.firstname} ${createdUser.lastname}` : 'Bilinmiyor'
        const result = {
            status: 'success',
            message: 'Yeni sipariş alındı.',
            newOrder
        }
        await sendMessageToAllClients(messageType, result);
        return result;
    } catch (error) {
        const result = {status: 'error', message: 'Yeni sipariş alınamadı.'}
        sendMessageToAllClients(messageType, result);
        console.error(`Sipariş veri tabanında bulunamadı (OrderId: ${orderId}) | Hata :`, error);
        return result;
    }
}

module.exports = {handleChangeProducts, handleNewOrder};
