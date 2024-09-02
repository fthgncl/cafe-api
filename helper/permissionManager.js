const User = require('../database/models/Users');
const {permissions} = require('../config.json');
const { connection } = require('../database/database');

function addUserPermissions(userId, newPermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId)
            .then(response => response.permissions)
            .then(userPermissions => {
                for (const permission of newPermissions) {
                    if (permission && userPermissions.indexOf(permission) === -1)
                        userPermissions += permission;
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

function removeUserPermissions(userId, removePermissions) {
    return new Promise((resolve, reject) => {
        readUserPermissions(userId)
            .then(response => response.permissions)
            .then(userPermissions => {
                for (const permission of removePermissions) {
                    if (permission.code)
                        userPermissions = userPermissions.replaceAll(permission.code, '');
                }
                return userPermissions;
            })
            .then(userNewPermissions => {
                setUserPermissions(userId, userNewPermissions)
                    .then(data => resolve(data))
                    .catch(error => reject(error))
            })
            .catch(error => reject(error));
    });
}

const readUserPermissions = (userId) => {
    return new Promise((resolve, reject) => {
        // Kullanıcıyı ID'ye göre bulmak için sorgu oluştur
        const query = `SELECT permissions FROM users WHERE id = ?`;

        // Sorguyu çalıştır
        connection.query(query, [userId], (err, results) => {
            if (err) {
                return reject({
                    status: 500,
                    message: 'Veritabanı hatası sırasında kullanıcı yetkileri okunamadı.',
                    error: err
                });
            }

            if (results.length === 0) {
                // Kullanıcı bulunamazsa
                return reject({
                    status: 404,
                    message: `Kullanıcı bilgileri veri tabanında bulunamadı (userId: ${userId})`,
                    error: 'Kullanıcı bulunamadı'
                });
            }

            // Kullanıcı bulundu ve yetkileri alındı
            resolve({
                status: 200,
                message: 'Kullanıcı yetkileri okundu',
                permissions: results[0].permissions
            });
        });
    });
};

module.exports = readUserPermissions;


function checkRoles(permissionsString) {
    const roles = [];

    for (const key in permissions) {
        if (permissions.hasOwnProperty(key)) {
            if (permissionsString.includes(permissions[key].code)) {
                roles.push(key);
            }
        }
    }

    return roles;
}

async function checkUserRoles(userId, roles = ['sys_admin'], fullMatch = false) {
    try {
        const data = await readUserPermissions(userId);
        const userPermissions = data.permissions;
        const userRoles = checkRoles(userPermissions);

        if (userRoles.includes('sys_admin'))
            return true;

        if (fullMatch)
            return roles.every(role => userRoles.includes(role));    // roles array'ında bulunan her bir index userRoles array'ında da bulunuyorsa true döner
        else
            return roles.some(role => userRoles.includes(role));    // roles array'ında bulunan her hangi bir index userRoles array'ında da bulunuyorsa true döner

    } catch (error) {
        console.error(`Kullanıcının (id:${userId}) yetkileri kontrol edilirken hata oluştu:`, error);
    }
}

function setUserPermissions(userId, permissions) {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(userId, {permissions: alfabetikSirala(permissions)}, {new: true})
            .then(data => resolve({
                status: true,
                message: 'İşlem başarılı',
                newPermissions: alfabetikSirala(data.permissions)
            }))
            .catch(error => reject(error))
    })
}

function alfabetikSirala(metin) {
    // Metni diziye dönüştür
    let dizi = metin.split('');

    // Diziyi Set'e dönüştürerek tekrar eden karakterleri kaldır
    let benzersizDizi = Array.from(new Set(dizi));

    // Diziyi alfabetik olarak sırala
    let siralanmisDizi = benzersizDizi.sort();

    // Alfabetik sıralanmış diziyi birleştirerek sonucu oluştur
    return siralanmisDizi.join('');
}

module.exports = {readUserPermissions, checkUserRoles, addUserPermissions, setUserPermissions, removeUserPermissions};