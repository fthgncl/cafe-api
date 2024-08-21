const mongoose = require('mongoose');
const Orders = require('../database/models/Orders');
const Products = require('../database/models/Products');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");
const { handleNewOrder } = require("../helper/databaseChangesNotifier");

async function orderEntry(socket, {message, type, token}) {
    try {
        const permissionsControlResult = await orderEntryPermissionsControl(token, message);
        if (permissionsControlResult.status !== 'success') {
            await sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        const processedMessage = await processMessage(message, token);

        const saveResult = await saveOrders(processedMessage);
        if (saveResult.status === 'success') {
            await handleNewOrder(saveResult.data.id);

            if (saveResult.data)
                delete saveResult.data;

            await sendSocketMessage(socket, type, saveResult)
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

async function processMessage(message, token) {

    const {orders, paymentStatus, discount} = message;
    if (
        !Array.isArray(orders) ||
        !orders.length ||
        typeof paymentStatus !== 'string' ||
        !paymentStatus.trim() ||
        typeof discount !== 'number'
    ) {
        return {
            status: 'error',
            message: 'Geçersiz veya eksik parametreler var. [orders, paymentStatus,discount]'
        };
    }


    const orderPriceResult = await calculateOrderPrice(orders);
    if (orderPriceResult.status === 'error') {
        return orderPriceResult;
    }

    return {
        ...message,
        totalPrice: orderPriceResult.totalPrice,
        discountedPrice: orderPriceResult.totalPrice - orderPriceResult.totalPrice * discount / 100,
        user: new mongoose.Types.ObjectId(token.id)
    };
}

async function orderEntryPermissionsControl(token, message) {
    try {
        const hasRequiredRoles = await checkUserRoles(token.id, ['order_entry']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Sipariş girişi için gerekli izinlere sahip değilsiniz.'
            };
        }

        const {discount} = message;

        if (discount && discount !== 0) {
            const hasDiscountPermission = await checkUserRoles(token.id, ['discount_application']);
            if (!hasDiscountPermission) {
                return {
                    status: 'error',
                    message: 'İndirim uygulama iznine sahip değilsiniz.'
                };
            }
        }

        return {
            status: 'success',
            message: 'İndirim yapma yetkisine sahipsiniz.'
        };

    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı rolleri kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

async function saveOrders(processedMessage) {
    try {
        const orders = new Orders(processedMessage);
        const saveData = await orders.save();
        return {
            status: 'success',
            message: 'Sipariş başarıyla kaydedildi.',
            data: saveData
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Sipariş kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
            error
        };
    }
}

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

            if (!order.product || !order.product._id) {
                return {
                    status: 'error',
                    message: 'Geçersiz istek: Her siparişin product._id alanı olmalıdır.'
                };

            }

            try {
                const product = await Products.findById(order.product._id);
                if (!product) {
                    return {
                        status: 'error',
                        message: `Ürün bulunamadı: ID ${order.product._id}`
                    };
                }

                const selectedSize = order.size;
                const selectedContent = order.content;
                const quantity = order.quantity;


                if (!product || !product.sizes || quantity <= 0) return 0;

                // Boyut fiyatını bul
                const size = product.sizes.find(size => size.size === selectedSize);
                if (!size) return 0;

                // İçerik ek ücreti
                const content = product.contents.find(content => content.name === selectedContent);
                const contentFee = content ? content.extraFee : 0;

                // Toplam fiyat hesapla
                totalPrice += (size.price + contentFee) * quantity;

            } catch (dbError) {
                return {
                    status: 'error',
                    message: 'Veritabanı hatası: Ürün bilgileri alınırken bir hata oluştu.',
                    error: dbError
                };
            }

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
