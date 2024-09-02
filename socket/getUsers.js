const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getUsers(socket, { type, tokenData }) {

    try {
        // Kullanıcının yetkilerini kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['sys_admin']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        // Kullanıcıları sorgula
        const query = 'SELECT id, firstname, lastname, username, phone, createdDate, permissions FROM users';
        const users = await connection.queryAsync(query);

        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Kullanıcı listesi başarıyla alındı.',
            users
        });
        return users;
    } catch (error) {
        console.error('Kullanıcı bilgileri veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı bilgileri veri tabanından alınamadı.'
        });
    }
}

module.exports = getUsers;
