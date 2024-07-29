const User = require('../database/models/Users');
const bcrypt = require('bcryptjs');
const { sendSocketMessage } = require('../helper/socket');
const { tokenLifeTimeMinute } = require('../config.json');
const { encryptData } = require('../helper/crypto');

module.exports = function login(socket, data) {
    const { username, password } = data.message;
    const messageType = 'login';

    if (!username || !password) {
        sendSocketMessage(socket, messageType, {
            success: false,
            message: 'Lütfen kullanıcı adı ve şifrenizi giriniz.'
        } );
        return;
    }

    User.findOne({ username })
        .then(async user => {
            if (user && await bcrypt.compare(password, user.password)) {

                const exp = tokenLifeTimeMinute * 60000 + Date.now();
                const userTokenData = {
                    id : user.id,
                    exp
                }

                const token = encryptData(JSON.stringify(userTokenData));

                sendSocketMessage(socket, messageType, {
                    success: true,
                    message: 'Başarıyla giriş yaptınız.',
                    accountProps : {
                        firstname : user.firstname,
                        username : user.username,
                        permissions: user.permissions,
                        token,
                        exp
                    }
                });

            } else {
                sendSocketMessage(socket, messageType, {
                    success: false,
                    message: 'Kullanıcı adı veya şifre hatalı.'
                });
            }
        })
        .catch(error => {
            console.error('Veritabanı hatası:', error);
            sendSocketMessage(socket, messageType, {
                success: false,
                message: 'Sistemsel bir hata oluştu, lütfen sistem yöneticisine haber veriniz.'
            });
        });
}
