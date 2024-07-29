const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    productname: {
        type: String,
        required: true,
        unique: true,
        maxlength: [20, '`{PATH}` alanı ({VALUE}), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [1, '`{PATH}` alanı ({VALUE}), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    productcategory: {
        type: String,
        required: true,
        maxlength: [20, '`{PATH}` alanı ({VALUE}), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [1, '`{PATH}` alanı ({VALUE}), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    sizes: [{
        size: { type: String, required: true },
        price: { type: Number, default: 0, min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz'] }
    }],
    contents: [{
        name: { type: String, required: true },
        extraFee: { type: Number, default: 0, min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz'] }
    }],
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('products', ProductSchema);
