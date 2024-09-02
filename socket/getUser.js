const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getUser(socket, { message, type, tokenData }) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['sys_admin']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const [user] = await connection.queryAsync('SELECT id, firstname, lastname, username, phone, createdDate, permissions FROM users WHERE id = ?', [message.userId]);

        if (!user) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bulunamadı.'
            });
            return;
        }

        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Kullanıcı bilgisi başarıyla alındı.',
            user
        });
        return user;
    } catch (error) {
        console.error('Kullanıcı bilgisi veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı bilgisi veri tabanından alınamadı.'
        });
    }
}

module.exports = getUser;
