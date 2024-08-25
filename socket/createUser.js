const User = require('../database/models/Users');
const bcrypt = require('bcryptjs');
const { checkUserRoles } = require('../helper/permissionManager');
require('../helper/stringTurkish');

const { sendSocketMessage , sendMessageToAllClients } = require('../helper/socket');
const Users = require("../database/models/Users");
const {handleChangeUsers} = require("../helper/databaseChangesNotifier");

module.exports = async function createUser(socket, {message, type, token, tokenData}) {

    const hasRequiredRoles = await checkUserRoles(tokenData.id);
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
            Users.findById(saveData.id).select('-password')
                .then(user => {
                    sendMessageToAllClients(type,{
                        status: 'success',
                        message: `${user.firstname} ${user.lastname} yeni kullanıcı olarak eklendi`,
                        data: user,
                        addedByToken: token,
                    })
                    handleChangeUsers(user.id,token);
                })
                .catch(error => {
                    sendSocketMessage(socket,type,{
                        status: 'error',
                        message: 'Kullanıcı kaydı yapıldı ancak veri tabanında bulunamadı.',
                        error
                    })
                })

        })
        .catch(error => {
            sendSocketMessage(socket,type,{
                status: 'error',
                message: 'Kullanıcı kaydı yapılamadı',
                error
            })
        });

}
