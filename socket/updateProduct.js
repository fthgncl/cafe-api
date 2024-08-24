const Products = require('../database/models/Products');
const {checkUserRoles} = require('../helper/permissionManager');
const {sendSocketMessage, sendMessageToAllClients} = require('../helper/socket');

module.exports = async function updateProduct(socket, {message, type, token}) {

    const hasRequiredRoles = await checkUserRoles(token.id,['admin']);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün düzenlemek için yetkiniz yok'
        });
        return;
    }

    const product = message;
    const productId = product.productId;
    delete product.id;

    const updatedProduct = await Products.findByIdAndUpdate(productId, product, {new: true});

    if (!updatedProduct) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün bulunamadı',
        })
        return;
    }

    sendMessageToAllClients(type, {
        status: 'success',
        message: 'Ürün başarıyla güncellendi',
        updatedProduct
    })

}
