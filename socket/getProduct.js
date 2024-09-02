const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getProduct(socket, { message, type, tokenData }) {
    try {
        // Kullanıcının yetkilerini kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['admin']);
        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const product = await readProduct(message.productId);


        if (product) {
            await sendSocketMessage(socket, type, {
                status: 'success',
                message: 'Ürün bilgisi başarıyla alındı.',
                product
            });
        } else {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Ürün bulunamadı.'
            });
        }

        return product;
    } catch (error) {
        console.error('Ürün bilgisi veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Ürün bilgisi veri tabanından alınamadı.'
        });
    }
}

async function readProduct(productId){
    // Ürün bilgilerini, boyutları ve içerikleri ile birlikte al
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
            WHERE p.id = ?
        `;

    const rows = await connection.queryAsync(query, [productId]);

    // Ürün bilgilerini boyutları ve içerikleri ile birlikte gruplandır
    let product = null;

    rows.forEach(row => {
        if (!product) {
            product = {
                id: row.id,
                productName: row.productName,
                productCategory: row.productCategory,
                createdDate: row.createdDate,
                sizes: [],
                contents: []
            };
        }

        // Size eklenmeden önce kontrol et
        if (row.productSize && row.productPrice !== null) {
            const sizeExists = product.sizes.some(size => size.size === row.productSize && size.price === row.productPrice);
            if (!sizeExists) {
                product.sizes.push({
                    size: row.productSize,
                    price: row.productPrice
                });
            }
        }

        // Content eklenmeden önce kontrol et
        if (row.contentName && row.contentExtraFee !== null) {
            const contentExists = product.contents.some(content => content.name === row.contentName);
            if (!contentExists) {
                product.contents.push({
                    name: row.contentName,
                    extraFee: row.contentExtraFee
                });
            }
        }
    });

    return product;
}

module.exports = { readProduct , getProduct };
