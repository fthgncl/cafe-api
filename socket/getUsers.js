const Users = require('../database/models/Users');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getUsers(socket, { type, tokenData }) {

    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['sys_admin']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı bilgilerine erişebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }

        const users = await Users.find().select('-password');

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
