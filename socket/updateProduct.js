const { checkUserRoles } = require('../helper/permissionManager');
const { sendSocketMessage, sendMessageToAllClients } = require('../helper/socket');
const { connection } = require('../database/database');
require('../helper/stringTurkish');

module.exports = async function updateProduct(socket, { message, type, tokenData, token }) {
    try {
        // Kullanıcının gerekli rollere sahip olup olmadığını kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['admin']);
        if (!hasRequiredRoles) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün düzenlemek için yetkiniz yok'
            });
            return;
        }

        const productId = message.productId;
        const { productName, productCategory, sizes, contents } = message;

        // Şartlı güncelleme için SQL sorgusunu hazırla
        const updateFields = {};
        if (productName) {
            updateFields.productName = productName.toUpperOnlyFirstChar();
        }
        if (productCategory) {
            updateFields.productCategory = productCategory.toUpperOnlyFirstChar();
        }

        const updateProductQuery = `
            UPDATE products
            SET productName = COALESCE(?, productName),
                productCategory = COALESCE(?, productCategory)
            WHERE id = ?
        `;

        await connection.queryAsync(updateProductQuery, [
            updateFields.productName || null,
            updateFields.productCategory || null,
            productId
        ]);

        // Ürün boyutlarını güncelle
        if (sizes && sizes.length > 0) {
            const deleteSizesQuery = 'DELETE FROM product_sizes WHERE productId = ?';
            await connection.queryAsync(deleteSizesQuery, [productId]);

            const insertSizesQuery = 'INSERT INTO product_sizes (productId, size, price) VALUES ?';
            const sizesData = sizes.map(size => [productId, size.size.toUpperOnlyFirstChar(), size.price]);
            await connection.queryAsync(insertSizesQuery, [sizesData]);
        }

        // Ürün içeriklerini güncelle
        if (contents && contents.length > 0) {
            const deleteContentsQuery = 'DELETE FROM product_contents WHERE productId = ?';
            await connection.queryAsync(deleteContentsQuery, [productId]);

            const insertContentsQuery = 'INSERT INTO product_contents (productId, name, extraFee) VALUES ?';
            const contentsData = contents.map(content => [productId, content.name.toUpperOnlyFirstChar(), content.extraFee]);
            await connection.queryAsync(insertContentsQuery, [contentsData]);
        }

        // Güncellenmiş ürünü almak için sorgu
        const getUpdatedProductQuery = 'SELECT * FROM products WHERE id = ?';
        const [updatedProduct] = await connection.queryAsync(getUpdatedProductQuery, [productId]);

        // Ürün boyutlarını almak için sorgu
        const getProductSizesQuery = 'SELECT size, price FROM product_sizes WHERE productId = ?';
        const productSizesRows = await connection.queryAsync(getProductSizesQuery, [productId]);

        // Ürün içeriklerini almak için sorgu
        const getProductContentsQuery = 'SELECT name, extraFee FROM product_contents WHERE productId = ?';
        const productContentsRows = await connection.queryAsync(getProductContentsQuery, [productId]);


        // Güncellenmiş ürüne boyut ve içerik bilgilerini ekle
        updatedProduct.sizes = productSizesRows;
        updatedProduct.contents = productContentsRows;

        // Tüm istemcilere güncelleme mesajı gönder
        sendMessageToAllClients(type, {
            status: 'success',
            message: `${updatedProduct.productName} bilgileri güncellendi.`,
            updatedProduct,
            addedByToken: token
        });

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün bilgileri güncellenemedi.',
            error
        });
        console.error('Ürün bilgileri güncellenirken hata oluştu:', error);
    }
};
