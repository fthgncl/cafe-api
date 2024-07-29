const GetProducts = require('../database/models/Products');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getProducts(socket, { message, type, token }) {
    try {
        const hasRequiredRoles = await checkUserRoles(token.id, ['sys_admin', 'order_entry']);

        if (!hasRequiredRoles) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const products = await GetProducts.find();
        sendSocketMessage(socket, type, {
            status : 'success',
            message : 'Ürün listesi başarıyla alındı.',
            products
        });
        return products;
    } catch (error) {
        console.error('Ürünler veri tabanından alınamadı:', error);
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Veri tabanından ürünler alınamadı.'
        });
        throw error; // Hata yönetimi açısından bu hatayı yükseltmek isteyebilirsiniz.
    }
}

module.exports = getProducts;
