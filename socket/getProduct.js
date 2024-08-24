const Products = require('../database/models/Products');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getProduct(socket, { message, type, token }) {
    try {
        const hasRequiredRoles = await checkUserRoles(token.id, ['admin']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const product = await Products.findById(message.productId);

        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Ürün bilgisi başarıyla alındı.',
            product
        });
        return product;
    } catch (error) {
        console.error('Ürün bilgisi veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün bilgisi veri tabanından alınamadı.'
        });
    }
}

module.exports = getProduct;
