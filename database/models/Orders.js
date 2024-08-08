const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    orders: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, '`{PATH}` alanı ({VALUE}) 1\'den küçük olamaz']
        },
        size: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        }
    }],
    orderNote: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['Ödendi', 'Daha Sonra Ödenecek', 'Hediye', 'İptal Edildi'],
        required: true
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz'],
        max: [100, '`{PATH}` alanı en fazla 100 olabilir']
    },
    discountedPrice: {
        type: Number,
        default: 0,
        min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz']
    },
    totalPrice: {
        type: Number,
        required: true,
        min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz']
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    }
});

module.exports = mongoose.model('orders', OrderSchema);
