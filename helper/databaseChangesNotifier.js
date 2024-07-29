const WebSocket = require('ws');
const GetProducts = require("../database/models/Products");

let wss

function setWebSocketServer(server){
    wss = server;
}

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

function sendMessageToAllClients(messageType, message) {
    const fullMessage = { type: messageType, message };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(fullMessage));
        }
    });
}

module.exports = { setWebSocketServer , handleChangeProducts };
