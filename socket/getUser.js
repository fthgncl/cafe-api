const Users = require('../database/models/Users');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getUser(socket, { message, type, token }) {
    try {
        const hasRequiredRoles = await checkUserRoles(token.id, ['sys_admin']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const user = await Users.findById(message.userId).select('-password');

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
