const User = require('../datebase/models/Users');
const bcrypt = require('bcryptjs');
require('../helper/stringTurkish');

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
                console.log(bcryptPass);
                user.password = bcryptPass;
            });
    }

    // TODO: Bu işlemi sadece yönetici yapabilecek şekilde ayarla
    user.save()
        .then(saveData => {
            socket.send(JSON.stringify({
                status: 'success',
                message: 'Kayıt başarılı',
                type,
                data: saveData
            }));
        })
        .catch(error => {
            socket.send(JSON.stringify({
                status: 'error',
                message: 'Kayıt başarısız',
                type,
                error
            }));
        });

}
