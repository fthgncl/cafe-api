const { connection } = require('../database/database');
const { sendSocketMessage, sendMessageToAllClients} = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

// Sipariş işlemini yönetir
async function orderEntry(socket, { message, type, tokenData }) {
    try {
        // Kullanıcının gerekli yetkilere sahip olduğunu kontrol et
        const permissionsControlResult = await orderEntryPermissionsControl(tokenData, message);
        if (permissionsControlResult.status !== 'success') {
            await sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        // Mesajı işleyerek gerekli verileri hazırlayın
        const processedMessage = await processMessage(message, tokenData);
        if (processedMessage.status === 'error') {
            await sendSocketMessage(socket, type, processedMessage);
            return;
        }

        // Siparişi veritabanına kaydet
        const saveResult = await saveOrders(processedMessage);

        if (saveResult.status === 'success') {
            // İstemciye yanıt gönder
            await sendSocketMessage(socket, type, saveResult);

            // Yeni siparişi `newOrder` formatına dönüştür
            const newOrder = await convertSaveResultToNewOrder(saveResult, processedMessage,tokenData);

            // Yeni siparişi tüm bağlı istemcilere bildir
            await sendMessageToAllClients('newOrder', {
                status: 'success',
                message: 'Yeni sipariş alındı.',
                newOrder: newOrder
            });
        }
    } catch (error) {
        console.error('Sipariş işlemi sırasında hata: ', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş işlemi sırasında bir hata oluştu.',
            error: error.message
        });
    }
}

// `saveResult` verisini `newOrder` formatına dönüştürür
async function convertSaveResultToNewOrder(saveResult, processedMessage, tokenData) {
    const { customerName, orderNote, paymentStatus, discount, discountedPrice, totalPrice, userId } = processedMessage;

    const orderId = saveResult.orders[0].orderId; // ilk kayıttan orderId'yi alıyoruz, tüm kayıtlar için aynı olmalı
    const createdDate = new Date().toISOString(); // Siparişin oluşturulma tarihini al

    const items = saveResult.orders.map((order) => ({
        orderId,
        productId: order.product.id,
        quantity: order.quantity,
        size: order.size,
        content: order.content,
        productName: order.product.productName
    }));

    const [createdBy] = await connection.queryAsync('SELECT * FROM users WHERE id=?',tokenData.id);

    return {
        id: orderId,
        customerName,
        orderNote: orderNote || '',
        paymentStatus,
        discount,
        discountedPrice,
        totalPrice,
        kitchenStatus: 'Beklemede',
        createdDate,
        userId,
        createdBy: `${createdBy.firstname} ${createdBy.lastname}`,
        items
    };
}

// Sipariş mesajını işleyerek gerekli hesaplamaları yapar
async function processMessage(message, tokenData) {
    const { orders, paymentStatus, discount } = message;

    if (
        !Array.isArray(orders) ||
        !orders.length ||
        typeof paymentStatus !== 'string' ||
        !paymentStatus.trim() ||
        typeof discount !== 'number'
    ) {
        return {
            status: 'error',
            message: 'Geçersiz veya eksik parametreler var. [orders, paymentStatus, discount]'
        };
    }

    // Sipariş fiyatını hesapla
    const orderPriceResult = await calculateOrderPrice(orders);
    if (orderPriceResult.status === 'error') {
        return {
            status: orderPriceResult.status,
            message: 'Sipariş fiyatlandırılması yapılırken hata oluştu.',
            orders
        };
    }

    return {
        ...message,
        totalPrice: orderPriceResult.totalPrice,
        discountedPrice: orderPriceResult.totalPrice - (orderPriceResult.totalPrice * discount / 100),
        userId: tokenData.id
    };
}

// Kullanıcının gerekli izinlere sahip olup olmadığını kontrol eder
async function orderEntryPermissionsControl(tokenData, message) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['order_entry']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Sipariş girişi için gerekli izinlere sahip değilsiniz.'
            };
        }

        if (message.discount && message.discount !== 0) {
            const hasDiscountPermission = await checkUserRoles(tokenData.id, ['discount_application']);
            if (!hasDiscountPermission) {
                return {
                    status: 'error',
                    message: 'İndirim uygulama iznine sahip değilsiniz.'
                };
            }
        }

        return {
            status: 'success',
            message: 'Sipariş girişi için gerekli izinlere sahipsiniz.'
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

// Siparişi veritabanına kaydeder
async function saveOrders(processedMessage) {

    const { orders, orderNote, paymentStatus, discount, customerName, discountedPrice, totalPrice, userId } = processedMessage;

    const orderData = {
        orderNote,
        paymentStatus,
        discount,
        customerName,
        discountedPrice,
        totalPrice,
        userId
    };

    try {
        // 'orders' tablosuna siparişi ekleyin
        const query = 'INSERT INTO orders SET ?';
        const orderResult = await connection.queryAsync(query, orderData);

        // Siparişin ID'sini alın
        const orderId = orderResult.insertId;

        // 'order_items' tablosuna sipariş içeriğini ekleyin
        const orderItems = orders.map(order => ({
            orderId,
            productId: order.product.id, // ürün ID'si
            size: order.size,
            content: order.content,
            quantity: order.quantity
        }));


        const itemsQuery = 'INSERT INTO order_items (orderId, productId, size, content, quantity) VALUES ?';
        const itemsValues = orderItems.map(item => [item.orderId, item.productId, item.size, item.content, item.quantity]);

        await connection.queryAsync(itemsQuery, [itemsValues]);

        return {
            status: 'success',
            message: 'Sipariş ve sipariş içeriği başarıyla kaydedildi.',
            orders
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Sipariş kaydedilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            error
        };
    }
}



// Sipariş fiyatını veri tabanından hesaplar
async function calculateOrderPrice(orders) {
    try {
        if (!Array.isArray(orders)) {
            return {
                status: 'error',
                message: 'Geçersiz istek: Siparişler bir dizi (array) olmalıdır.'
            };
        }

        let totalPrice = 0;

        for (const order of orders) {
            if (typeof order !== 'object' || order === null) {
                return {
                    status: 'error',
                    message: 'Geçersiz istek: Her sipariş bir nesne (object) olmalıdır.'
                };
            }

            const { product, size, content, quantity } = order;

            if (!product || !product.id) {
                return {
                    status: 'error',
                    message: 'Geçersiz istek: Her siparişin product.id alanı olmalıdır.'
                };
            }

            if (!size || quantity <= 0) {
                return {
                    status: 'error',
                    message: 'Geçersiz istek: Boyut bilgisi veya miktar eksik veya hatalı.'
                };
            }

            // Ürün boyut fiyatını al
            const sizeQuery = 'SELECT price FROM product_sizes WHERE productId = ? AND size = ?';
            const sizeResult = await connection.queryAsync(sizeQuery, [product.id, size]);

            if (sizeResult.length === 0) {
                return {
                    status: 'error',
                    message: `Boyut bulunamadı: Ürün ID ${product.id}, Boyut ${size}`
                };
            }

            const sizePrice = sizeResult[0].price;

            // İçerik ek ücretini al
            const contentQuery = 'SELECT extraFee FROM product_contents WHERE productId = ? AND name = ?';
            const contentResult = await connection.queryAsync(contentQuery, [product.id, content]);

            const contentFee = contentResult.length > 0 ? contentResult[0].extraFee : 0;

            // Toplam fiyat hesapla
            totalPrice += (sizePrice + contentFee) * quantity;
        }

        return {
            status: 'success',
            orders,
            totalPrice
        };

    } catch (error) {
        return {
            status: 'error',
            message: 'Sipariş fiyatı hesaplanırken bir hata oluştu.',
            error
        };
    }
}



module.exports = orderEntry;
