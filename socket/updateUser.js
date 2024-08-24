const Users = require('../database/models/Users');
const bcrypt = require('bcryptjs');
const {checkUserRoles} = require('../helper/permissionManager');
require('../helper/stringTurkish');

const {sendSocketMessage, sendMessageToAllClients} = require('../helper/socket');

module.exports = async function updateUser(socket, {message, type, token}) {

    const hasRequiredRoles = await checkUserRoles(token.id);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı düzenlemek için yetkiniz yok'
        });
        return;
    }

    if (token.id === message.userId) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kendinize ait verileri düzenleyemezsiniz.'
        });
        return;
    }

    const user = message;
    const userId = user.userId;
    delete user.id;

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

    const updatedUser = await Users.findByIdAndUpdate(userId, user, {new: true}).select('-password');

    if (!updatedUser) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı bulunamadı',
        })
        return;
    }

    sendMessageToAllClients(type, {
        status: 'success',
        message: 'Kullanıcı başarıyla güncellendi',
        updatedUser
    })

}
