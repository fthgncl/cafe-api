const Users = require('../database/models/Users');
const bcrypt = require('bcryptjs');
const {checkUserRoles} = require('../helper/permissionManager');
require('../helper/stringTurkish');

const {sendSocketMessage, sendMessageToAllClients} = require('../helper/socket');

module.exports = async function updateUser(socket, {message, type, tokenData,token}) {

    const hasRequiredRoles = await checkUserRoles(tokenData.id);
    if (!hasRequiredRoles) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı düzenlemek için yetkiniz yok'
        });
        return;
    }

    if (tokenData.id === message.userId) {
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

    Users.findByIdAndUpdate(userId, user, {new: true}).select('-password')
        .then(updatedUser => {
            sendMessageToAllClients(type,{
                status: 'success',
                message: `${updatedUser.firstname} ${updatedUser.lastname} bilgileri güncellendi222`,
                updatedUser,
                addedByToken: token
            })
        })
        .catch(error => {
            sendSocketMessage(socket,type,{
                status: 'error',
                message: 'Kullanıcı bilgileri güncellenemedi.',
                error
            })
        })


}
