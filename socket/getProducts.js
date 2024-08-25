const Products = require('../database/models/Products');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getProducts(socket, { type, tokenData }) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['order_entry','payment_processing','admin']);
        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const products = await Products.find();
        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Ürün listesi başarıyla alındı.',
            products
        });
        return products;
    } catch (error) {
        console.error('Ürünler veri tabanından alınamadı:', error);
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Veri tabanından ürünler alınamadı.'
        });
    }
}

module.exports = getProducts;
