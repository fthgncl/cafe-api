const {connection} = require("../database/database");
const {sendMessageToAllClients} = require("./socket");
const isGiftorPayment = (status) => (status === 'Ödendi' || status === 'Hediye');
const isPendingOrPreparing = (status) => (status === 'Beklemede' || status === 'Hazırlanıyor');

async function orderSetItems(order) {

    try {
        const orderItems = await connection.queryAsync(
            'SELECT * FROM order_items WHERE orderId = ?',
            [order.id]
        );

        order.items = await Promise.all(orderItems.map(async item => {
            try {
                const productRows = await connection.queryAsync(
                    'SELECT productName FROM products WHERE id = ?',
                    [item.productId]
                );

                const productName = productRows.length > 0 ? productRows[0].productName : 'Bilinmeyen Ürün';

                const { productId,size,content,quantity } = item;
                const totalPrice = await calculateProductPrice(productId,size,content,quantity);
                const discountedPrice = totalPrice - totalPrice * order.discount / 100;

                return {
                    ...item,
                    productName,
                    totalPrice,
                    discountedPrice
                };
            } catch (error) {
                console.error('Ürün adı sorgusunda hata:', error);
                return {
                    productName: '---'
                };
            }
        }));
    } catch (error) {
        console.error('Sipariş öğeleri sorgusunda hata:', error);
    }
}

async function updatedOrderPaymentStatus(order,oldPaymentStatus,newPaymentStatus,kitchenStatus){
    await orderSetItems(order);
    if ( kitchenStatus === 'Hazırlandı' && isGiftorPayment(oldPaymentStatus) !== isGiftorPayment(newPaymentStatus) ){
        isGiftorPayment(newPaymentStatus) ? onOrderSold(order) : onOrderCancelled(order);
    }
}

async function updatedOrderKitchenStatustStatus(order,oldKitchenStatus,newKitchenStatus,paymentStatus){
    await orderSetItems(order);
    if ( isGiftorPayment(paymentStatus) && isPendingOrPreparing(oldKitchenStatus) !== isPendingOrPreparing(newKitchenStatus) ){
        !isPendingOrPreparing(newKitchenStatus) ? onOrderSold(order) : onOrderCancelled(order);
    }
}

async function onOrderCancelled(order) {
    try {
        // Sales tablosundaki ilgili kayıtları sipariş id'sine göre sil
        await connection.queryAsync(
            'DELETE FROM sales WHERE orderId = ?',
            [order.id]
        );
        sendUpdatedSalesMessage();
    } catch (error) {
        console.error('Sales tablosundan kayıt silinirken hata oluştu:', error);
    }
}

async function onOrderSold(order) {
    const orderItems = order.items || [];
    const orderId = order.id;

    try {
        // Her bir ürünü sales tablosuna kaydetmek için
        for (const item of orderItems) {
            const productId = item.productId;
            const productName = item.productName || '';
            const contentName = item.content || '';
            const quantity = item.quantity;
            const discount = order.discount || 0;
            const discountedPrice = item.discountedPrice || 0;
            const totalPrice = item.totalPrice || 0;

            // Sales tablosuna kaydet
            await connection.queryAsync(
                `
                INSERT INTO sales (orderId, productId, productName, contentName, quantity, discount, discountedPrice, totalPrice)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [orderId, productId, productName, contentName, quantity, discount, discountedPrice, totalPrice]
            );
        }
        sendUpdatedSalesMessage();
    } catch (error) {
        console.error('Satış kaydedilirken hata oluştu:', error);
    }
}

async function calculateProductPrice(productId,size,content,quantity){
    // Ürün boyut fiyatını al
    const sizeQuery = 'SELECT price FROM product_sizes WHERE productId = ? AND size = ?';
    const sizeResult = await connection.queryAsync(sizeQuery, [productId, size]);

    if (sizeResult.length === 0) {
        return {
            status: 'error',
            message: `Boyut bulunamadı: Ürün ID ${product.id}, Boyut ${size}`
        };
    }

    const sizePrice = sizeResult[0].price;

    // İçerik ek ücretini al
    const contentQuery = 'SELECT extraFee FROM product_contents WHERE productId = ? AND name = ?';
    const contentResult = await connection.queryAsync(contentQuery, [productId, content]);

    const contentFee = contentResult.length > 0 ? contentResult[0].extraFee : 0;

    // Toplam fiyat hesapla
    return (sizePrice + contentFee) * quantity;
}

function sendUpdatedSalesMessage(){
    setTimeout(() => {
        sendMessageToAllClients('updatedSales', {
            status: 'success',
            message: 'Sales tablosu güncellendi',
        });
    }, 1000); // 1000 milisaniye = 1 saniye

}

module.exports = { updatedOrderPaymentStatus, updatedOrderKitchenStatustStatus }