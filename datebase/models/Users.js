const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstname: {
        type: String, required: true,
        maxlength: [20, '`{PATH}` alanı (`{VALUE}`), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [3, '`{PATH}` alanı (`{VALUE}`), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    lastname: {
        type: String, required: true,
        maxlength: [20, '`{PATH}` alanı (`{VALUE}`), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [3, '`{PATH}` alanı (`{VALUE}`), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    username: {
        type: String, required: true, unique: true,
        maxlength: [20, '`{PATH}` alanı (`{VALUE}`), ({MAXLENGTH}) karakterden küçük olmalıdır'],
        minlength: [3, '`{PATH}` alanı (`{VALUE}`), ({MINLENGTH}) karakterden büyük olmalıdır'],
    },
    phone: {type: String, required: true, unique: true},
    password: {type: String, minlength: 6, required: true},
    createdDate: {type: Date, default: Date.now},
    permissions: { type: String, default: "" }
});

module.exports = mongoose.model('users', UserSchema);
