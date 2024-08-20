const { sendMessageToAllClients } = require('./socket');
const GetProducts = require("../database/models/Products");

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

module.exports = { handleChangeProducts };
