const isGiftorPayment = (status) => (status === 'Ödendi' || status === 'Hediye');
const isPendingOrPreparing = (status) => (status === 'Beklemede' || status === 'Hazırlanıyor');

function updatedOrderPaymentStatus(order,oldPaymentStatus,newPaymentStatus,kitchenStatus){

    if ( kitchenStatus === 'Hazırlandı' && isGiftorPayment(oldPaymentStatus) !== isGiftorPayment(newPaymentStatus) ){
        isGiftorPayment(newPaymentStatus) ? onOrderSold(order) : onOrderCancelled(order);
    }
}

function updatedOrderKitchenStatustStatus(order,oldKitchenStatus,newKitchenStatus,paymentStatus){

    if ( isGiftorPayment(paymentStatus) && isPendingOrPreparing(oldKitchenStatus) !== isPendingOrPreparing(newKitchenStatus) ){
        !isPendingOrPreparing(newKitchenStatus) ? onOrderSold(order) : onOrderCancelled(order);
    }
}

function onOrderCancelled(order) {
    console.log('Sipariş İptal Edildi');
}

function onOrderSold(order) {
    console.log('Sipariş Satıldı');
}


module.exports = { updatedOrderPaymentStatus, updatedOrderKitchenStatustStatus }