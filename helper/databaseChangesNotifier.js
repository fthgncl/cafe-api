const {sendMessageToAllClients} = require('./socket');
const GetProducts = require("../database/models/Products");
const Orders = require("../database/models/Orders");
const Users = require("../database/models/Users");

async function handleChangeProducts(productId,token) {
    const messageType = 'newProduct';
    try {
        const product = await GetProducts.findById(productId);
        sendMessageToAllClients(messageType, {
            status: 'success',
            message: 'Yeni ürün başarıyla eklendi.',
            addedByToken: token,
            product
        });
        return product;
    } catch (error) {
        console.error('Yeni ürün veri tabanına eklenemedi:', error);
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
