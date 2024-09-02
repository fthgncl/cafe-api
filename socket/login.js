const bcrypt = require('bcryptjs');
const { sendSocketMessage } = require('../helper/socket');
const { tokenLifeTimeMinute } = require('../config.json');
const { encryptData } = require('../helper/crypto');

module.exports = function login(socket, dbConnection, data) {
    const { username, password } = data.message;
    const messageType = data.type;

    if (!username || !password) {
        sendSocketMessage(socket, messageType, {
            status: 'error',
            message: 'Lütfen kullanıcı adı ve şifrenizi giriniz.'
        });
        return;
    }

    // Kullanıcıyı MySQL veritabanından bul
    const query = 'SELECT * FROM users WHERE username = ?';
    dbConnection.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            sendSocketMessage(socket, messageType, {
                status: 'error',
                message: 'Sistemsel bir hata oluştu, lütfen sistem yöneticisine haber veriniz.'
            });
            return;
        }

        if (results.length === 0) {
            sendSocketMessage(socket, messageType, {
                status: 'error',
                message: 'Kullanıcı adı veya şifre hatalı.'
            });
            return;
        }

        const user = results[0];

        // Şifreyi kontrol et
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const exp = tokenLifeTimeMinute * 60000 + Date.now();
            const userTokenData = {
                id: user.id,
                exp
            };

            const token = encryptData(JSON.stringify(userTokenData));

            sendSocketMessage(socket, messageType, {
                status: 'success',
                message: 'Başarıyla giriş yaptınız.',
                accountProps: {
                    firstname: user.firstname,
                    username: user.username,
                    permissions: user.permissions,
                    token,
                    exp
                }
            });
        } else {
            sendSocketMessage(socket, messageType, {
                status: 'error',
                message: 'Kullanıcı adı veya şifre hatalı.'
            });
        }
    });
};
