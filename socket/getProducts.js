const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getProducts(socket, { type, tokenData }) {
    try {
        // Kullanıcının yetkilerini kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['order_entry', 'payment_processing', 'admin']);
        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        // Ürünleri, boyutları ve içerikleri sorgula
        const query = `
            SELECT 
                p.id,
                p.productName,
                p.productCategory,
                p.createdDate,
                ps.size AS productSize,
                ps.price AS productPrice,
                pc.name AS contentName,
                pc.extraFee AS contentExtraFee
            FROM products p
            LEFT JOIN product_sizes ps ON p.id = ps.productId
            LEFT JOIN product_contents pc ON p.id = pc.productId
        `;

        const rows = await connection.queryAsync(query);

        // Ürünleri boyutları ve içerikleri ile birlikte grupla
        let productMap = {};
        let products = [];

        rows.forEach(row => {
            if (!productMap[row.id]) {
                productMap[row.id] = {
                    id: row.id,
                    productName: row.productName,
                    productCategory: row.productCategory,
                    createdDate: row.createdDate,
                    sizes: [],
                    contents: []
                };
                products.push(productMap[row.id]);
            }

            // Size eklenmeden önce kontrol et
            if (row.productSize && row.productPrice !== null) {
                const sizeExists = productMap[row.id].sizes.some(size => size.size === row.productSize && size.price === row.productPrice);
                if (!sizeExists) {
                    productMap[row.id].sizes.push({
                        size: row.productSize,
                        price: row.productPrice
                    });
                }
            }

            // Content eklenmeden önce kontrol et
            if (row.contentName && row.contentExtraFee !== null) {
                const contentExists = productMap[row.id].contents.some(content => content.name === row.contentName);
                if (!contentExists) {
                    productMap[row.id].contents.push({
                        name: row.contentName,
                        extraFee: row.contentExtraFee
                    });
                }
            }
        });



        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Ürün listesi başarıyla alındı.',
            products
        });
        return products;
    } catch (error) {
        console.error('Ürünler veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Veri tabanından ürünler alınamadı.'
        });
    }
}

module.exports = getProducts;
