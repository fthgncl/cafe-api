const Product = require('../database/models/Products');
const {checkUserRoles} = require('../helper/permissionManager');
const {sendSocketMessage} = require('../helper/socket');
const {handleChangeProducts} = require("../helper/databaseChangesNotifier");
require('../helper/stringTurkish');

module.exports = async function createProduct(socket, { message, type, token }) {

    const hasRequiredRoles = await checkUserRoles(token.id, ['sys_admin','admin']);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.'
        });
        return;
    }

    const product = new Product({
        productname: message.productname,
        productcategory: message.productcategory,
        productprice: message.productprice,
        sizes: message.sizes,
        contents: message.contents
    });

    if (product.productname) {
        product.productname = product.productname.toUpperOnlyFirstChar();
    }
    if (product.productcategory) {
        product.productcategory = product.productcategory.toUpperOnlyFirstChar();
    }

    product.save()
        .then(saveData => {
            sendSocketMessage(socket, type, {
                status: 'success',
                message: `${product.productname} ürün listesine eklenmiştir.`,
                data: saveData
            });
            handleChangeProducts();
        })
        .catch(error => {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün kaydında bir hata oluştu. Lütfen tekrar deneyiniz.',
                error
            });
        });

};
