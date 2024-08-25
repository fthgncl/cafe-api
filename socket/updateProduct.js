const Products = require('../database/models/Products');
const {checkUserRoles} = require('../helper/permissionManager');
const {sendSocketMessage, sendMessageToAllClients} = require('../helper/socket');

module.exports = async function updateProduct(socket, {message, type, tokenData, token}) {

    const hasRequiredRoles = await checkUserRoles(tokenData.id,['admin']);
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

    Products.findByIdAndUpdate(productId, product, {new: true})
        .then(updatedProduct => {
            sendMessageToAllClients(type,{
                status: 'success',
                message: `${updatedProduct.productname} bilgileri güncellendi.`,
                updatedProduct,
                addedByToken: token
            })
        })
        .catch(error => {
            sendSocketMessage(socket,type,{
                status: 'error',
                message: 'Ürün bilgileri güncellenemedi.',
                error
            })
        })

}
