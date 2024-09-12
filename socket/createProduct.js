const {connection} = require('../database/database');
const {checkUserRoles} = require('../helper/permissionManager');
const {sendSocketMessage, sendMessageToAllClients} = require('../helper/socket');
const {readProduct} = require('./getProduct');
require('../helper/stringTurkish');

module.exports = async function createProduct(socket, {message, type, tokenData, token}) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['admin']);
        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const {productName, productCategory, sizes, contents} = message;
        const newProduct = await connection.queryAsync(`INSERT INTO products (productName, productCategory) VALUES (?, ?)`, [productName.toUpperOnlyFirstChar(), productCategory.toUpperOnlyFirstChar()]);
        const productId = newProduct.insertId;

        if (sizes && sizes.length > 0) {
            const sizePromises = sizes.map(({size, price}) =>
                connection.query(
                    'INSERT INTO product_sizes (productId, size, price) VALUES (?, ?, ?)',
                    [productId, size.toUpperOnlyFirstChar(), price]
                )
            );
            await Promise.all(sizePromises);
        }

        if (contents && contents.length > 0) {
            const contentPromises = contents.map(({name, extraFee}) =>
                connection.query(
                    'INSERT INTO product_contents (productId, name, extraFee) VALUES (?, ?, ?)',
                    [productId, name.toUpperOnlyFirstChar(), extraFee]
                )
            );
            await Promise.all(contentPromises);
        }

        sendMessageToAllClients('newProduct', {
            status: 'success',
            message: 'Yeni ürün başarıyla eklendi.',
            addedByToken: token,
            product: await readProduct(productId)
        });

    } catch (error) {
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün kaydında bir hata oluştu. Lütfen tekrar deneyiniz.',
            error
        });
        console.error('Ürün kaydında bir hata oluştu:', error);
    }
};


