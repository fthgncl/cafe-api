const mongoose = require('mongoose');
const Orders = require('../database/models/Orders');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function orderEntry(socket, {message, type, token}) {
    try {
        const permissionsControlResult = await orderEntryPermissionsControl(token, message);
        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        const processedMessage = await processMessage(message, token);

        const saveResult = await saveOrders(processedMessage);
        if (saveResult.status === 'success') {
            // TODO: Buraya sipariş girişi yapıldı handle koy. Yeni sipariş verileri saveResult.data keyinde yer almaktadır.
            // TODO: yeni sipariş verilerini doğrudan push etme. ID kullanarak kayıtlı veriyi çek gönder.
            // TODO: Çünkü SQL tarzında bir veri tabanı kullanmıyorsun. Kaydı gerçekten yapmış mı bilemeyiz !

            if (saveResult.data)
                delete saveResult.data;

            console.log('Bir sipariş alındı.');
            sendSocketMessage(socket, type, saveResult);
        }

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Sipariş işlemi sırasında bir hata oluştu.',
            error: error.message
        });
        console.error('Sipariş işlemi sırasında hata: ', error);
    }
}

async function processMessage(message, token) {
    // TODO: Gerekli alanlar gönderilmediği durumlarda vs. burada kontrol sağla, veya kullanabiliyorsan doğrudan kayıt esnasında oluşan hata üzerinden kullan.
    // TODO: Burada sipariş tutarlarını sen hesapla. İstek olarak gönderilen tutara güvenme !
    return {...message, user: new mongoose.Types.ObjectId(token.id)};
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

module.exports = orderEntry;
