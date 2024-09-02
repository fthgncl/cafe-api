const { connection } = require('../database/database');
const { checkUserRoles } = require('../helper/permissionManager');
const { sendSocketMessage, sendMessageToAllClients } = require('../helper/socket');
require('../helper/stringTurkish');

module.exports = async function updateUser(socket, { message, type, tokenData, token }) {
    try {
        // Kullanıcının gerekli rollere sahip olup olmadığını kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id);
        if (!hasRequiredRoles) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı düzenlemek için yetkiniz yok'
            });
            return;
        }

        // Kendinize ait verileri düzenlemeye çalışırsanız hata mesajı gönder
        if (tokenData.id === message.userId) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kendinize ait verileri düzenleyemezsiniz.'
            });
            return;
        }

        const userUpdateData = {...message};
        if (userUpdateData.firstname) {
            userUpdateData.firstname = userUpdateData.firstname.toUpperOnlyFirstChar();
        }
        if (userUpdateData.lastname) {
            userUpdateData.lastname = userUpdateData.lastname.toUpperOnlyFirstChar();
        }

        // Kullanıcıyı güncelleme sorgusu
        const updateUserQuery = `
            UPDATE users
            SET firstname = COALESCE(?, firstname),
                lastname = COALESCE(?, lastname),
                username = COALESCE(?, username),
                phone = COALESCE(?, phone),
                permissions = COALESCE(?, permissions)
            WHERE id = ?
        `;

        const result = await connection.queryAsync(updateUserQuery, [
            userUpdateData.firstname || null,
            userUpdateData.lastname || null,
            userUpdateData.username || null,
            userUpdateData.phone || null,
            userUpdateData.permissions || null,
            userUpdateData.userId
        ]);

        if (result.affectedRows === 0) {
            sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bilgileri güncellenemedi. Kullanıcı bulunamadı.'
            });
            return;
        }

        // Güncellenmiş kullanıcıyı almak için sorgu
        const getUserQuery = 'SELECT id, firstname, lastname, username, phone, createdDate, permissions FROM users WHERE id = ?';
        const [updatedUser] = await connection.queryAsync(getUserQuery, [userUpdateData.userId]);

        // Tüm istemcilere güncelleme mesajı gönder
        sendMessageToAllClients(type, {
            status: 'success',
            message: `${updatedUser.firstname} ${updatedUser.lastname} bilgileri güncellendi`,
            updatedUser,
            addedByToken: token
        });

    } catch (error) {
        sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı bilgileri güncellenemedi.',
            error: error.message
        });
        console.error('Kullanıcı bilgileri güncellenirken hata oluştu:', error);
    }
};
