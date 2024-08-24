const Users = require('../database/models/Users');
const {sendSocketMessage, sendMessageToAllClients} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function deleteUser(socket, {message, type, tokenData}) {
    try {
        const permissionsControlResult = await deleteUserPermissionsControl(tokenData);

        if (permissionsControlResult.status !== 'success') {
            sendSocketMessage(socket, type, permissionsControlResult);
            return;
        }

        if (tokenData.id === message.userId) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kendinize ait verileri silemezsiniz.'
            });
            return;
        }

        Users.findByIdAndDelete(message.userId)
            .then(doc => {
                if (!doc) {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Kullanıcı bulunamadı'
                    });
                } else {
                    sendMessageToAllClients(type, {
                        status: 'success',
                        message: 'Kullanıcı silindi',
                        deletedUserId: message.userId
                    });
                }
            })
            .catch(error => {
                    sendSocketMessage(socket, type, {
                        status: 'error',
                        message: 'Kullanıcı silinirken veritabanında hata oluştu.',
                        error: error.message
                    });
                console.error('Kullanıcı silinirken veritabanında hata oluştu:', error);
            });


    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı silinirken hata oluştu.',
            error: error.message
        });
        console.error('Kullanıcı silinirken hata : ', error);
    }
}

async function deleteUserPermissionsControl(tokenData) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['sys_admin']);
        if (!hasRequiredRoles) {
            return {
                status: 'error',
                message: 'Kullanıcı silmek için gerekli izinlere sahip değilsiniz.'
            };
        }

        return {
            status: 'success',
            message: 'Kullanıcı silmek için yeterli yetkiye sahipsiniz.'
        }

    } catch (error) {
        return {
            status: 'error',
            message: 'Kullanıcı silme işlemi için yetki kontrolü sırasında bir hata meydana geldi.',
            details: error
        };
    }
}

module.exports = deleteUser;
