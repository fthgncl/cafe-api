const User = require('../datebase/models/Users');
const bcrypt = require('bcryptjs');
const { decryptData } = require('../helper/crypto');
const { checkUserRoles } = require('../helper/permissionManager');
require('../helper/stringTurkish');

const { sendSocketMessage } = require('../helper/socket');

module.exports = async function createUser(socket, {message, type, token}) {

    if (!token) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Yetkisiz'
        });
        return;
    }

    const tokenData = JSON.parse(await decryptData(token))

    if ( Date.now() > tokenData.exp ) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Oturum zaman aşımına uğradı'
        });
        return;
    }

    const hasRequiredRoles = await checkUserRoles(tokenData.id, ['sys_admin']);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı oluşturmak için yetkiniz yok'
        });
        return;
    }


    const user = new User(message);

    if (user.firstname) {
        user.firstname = user.firstname.toUpperOnlyFirstChar();
    }
    if (user.lastname) {
        user.lastname = user.lastname.toUpperOnlyFirstChar();
    }
    if (user.password) {
        await bcrypt.hash(user.password, 10)
            .then(bcryptPass => {
                user.password = bcryptPass;
            });
    }

    user.save()
        .then(saveData => {
            sendSocketMessage(socket,type,{
                status: 'success',
                message: 'Kayıt başarılı',
                data: saveData
            })
        })
        .catch(error => {
            sendSocketMessage(socket,type,{
                status: 'error',
                message: 'Kayıt başarısız',
                error
            })
        });

}
