const User = require('../datebase/models/Users');
const bcrypt = require('bcryptjs');
require('../helper/stringTurkish');

const { sendSocketMessage } = require('../helper/socket');

module.exports = async function createUser(socket, {message, type}) {

    const user = new User(message);

    if (user.firstName) {
        user.firstName = user.firstName.toUpperOnlyFirstChar();
    }
    if (user.lastName) {
        user.lastName = user.lastName.toUpperOnlyFirstChar();
    }
    if (user.password) {
        await bcrypt.hash(user.password, 10)
            .then(bcryptPass => {
                user.password = bcryptPass;
            });
    }

    // TODO: Bu işlemi sadece yönetici yapabilecek şekilde ayarla
    user.save()
        .then(saveData => {
            sendSocketMessage(socket,type,{
                status: 'success',
                message: 'Kayıt başarılı',
                data: saveData
            })
        })
        .catch(error => {
            sendSocketMessage(socket,type,{
                status: 'error',
                message: 'Kayıt başarısız',
                error
            })
        });

}
