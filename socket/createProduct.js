const Product = require('../datebase/models/Products');
const { checkUserRoles } = require('../helper/permissionManager');
require('../helper/stringTurkish');

const { sendSocketMessage } = require('../helper/socket');

module.exports = async function createProduct(socket, { message, type, token }) {
    console.log(message,type,token);
    if (!token) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Token parametresi gönderilmedi'
        });
        return;
    }

    if (Date.now() > token.exp) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Oturum zaman aşımına uğradı'
        });
        return;
    }

    const hasRequiredRoles = await checkUserRoles(token.id, ['sys_admin']);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün oluşturmak için yetkiniz yok'
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
                message: `Ürün ${product.productname} başarıyla eklendi`,
                data: saveData
            });
        })
        .catch(error => {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün kaydı yapılamadı',
                error
            });
        });

};
