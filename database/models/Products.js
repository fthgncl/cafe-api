const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    productname: {
        type: String,
        required: true,
        maxlength: [20, '`{PATH}` alanı ({VALUE}), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [1, '`{PATH}` alanı ({VALUE}), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    productcategory: {
        type: String,
        required: true,
        maxlength: [20, '`{PATH}` alanı ({VALUE}), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [1, '`{PATH}` alanı ({VALUE}), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    productprice: {
        type: Number,
        required: true,
        min: [0, '`{PATH}` alanı ({VALUE}) negatif olamaz'],
    },
    sizes: {
        small: { type: Boolean, default: false },
        medium: { type: Boolean, default: false },
        large: { type: Boolean, default: false },
    },
    contents: [{
        name: { type: String, required: true },
        extraFee: { type: Number, default: 0 }
    }],
    createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('products', ProductSchema);
