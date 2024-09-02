const bcrypt = require('bcryptjs');
const { connection } = require('../database/database');
const { checkUserRoles } = require('../helper/permissionManager');
require('../helper/stringTurkish');

const { sendSocketMessage, sendMessageToAllClients } = require('../helper/socket');

module.exports = async function createUser(socket, { message, type, token, tokenData }) {
    try {
        // Kullanıcının yeterli yetkiye sahip olup olmadığını kontrol et
        const hasRequiredRoles = await checkUserRoles(tokenData.id);
        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Kullanıcı oluşturmak için yetkiniz yok'
            });
            return;
        }

        // Kullanıcı nesnesini oluştur
        const user = {
            firstname: message.firstname ? message.firstname.toUpperOnlyFirstChar() : null,
            lastname: message.lastname ? message.lastname.toUpperOnlyFirstChar() : null,
            username: message.username,
            phone: message.phone,
            password: message.password ? await bcrypt.hash(message.password, 10) : null,
            permissions: message.permissions,
        };

        // Kullanıcıyı veritabanına ekle
        const query = `
            INSERT INTO users (firstname, lastname, username, phone, password, permissions)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [user.firstname, user.lastname, user.username, user.phone, user.password, user.permissions];
        const result = await connection.queryAsync(query, values);

        // Kullanıcının eklenen ID'sini kullanarak veri tabanından tekrar al
        const [newUser] = await connection.queryAsync('SELECT id, firstname, lastname, username, phone, createdDate, permissions FROM users WHERE id = ?', [result.insertId]);

        // Kullanıcı değişikliklerini bildir
        sendMessageToAllClients('newUser', {
            status: 'success',
            message: 'Yeni kullanıcı başarıyla eklendi.',
            addedByToken: token,
            user : newUser
        });

    } catch (error) {
        console.error('Kullanıcı oluşturulamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Kullanıcı kaydı yapılamadı.',
            error
        });
    }
};
