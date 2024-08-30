const mysql = require('mysql');
const {mysqlDatabase} = require('../config.json');
const controlUsersTable = require('./models/Users');
const { queryAsync } = require('../helper/databaseHelper');

const connection = mysql.createConnection({
    host: mysqlDatabase.host,
    user: mysqlDatabase.user,
    password: mysqlDatabase.password,
    port: mysqlDatabase.port
});

module.exports = () => {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Veritabanı bağlantısı kurulamadı. Lütfen bağlantı bilgilerini kontrol edin.',
                    error: err
                });
            }

            // Veritabanının mevcut olup olmadığını kontrol et
            queryAsync(connection,`SHOW DATABASES LIKE '${mysqlDatabase.database}'`)
                .then(results => {
                    if (results.length !== 1)
                        queryAsync(connection,`CREATE DATABASE ${mysqlDatabase.database}`)
                            .then(() => controlDataTables(connection)
                                .then(resolve)
                                .catch(reject))
                            .catch(error => reject({
                                status: 'error',
                                message: 'Veritabanı oluşturulamadı. Oluşturma işlemi sırasında bir hata meydana geldi.',
                                error
                            }))
                    else controlDataTables(connection)
                        .then(resolve)
                        .catch(reject)


                })
                .catch(error => {
                    reject({
                        status: 'error',
                        message: 'Veritabanı veya tablo işlemleri sırasında bir hata oluştu.',
                        error: error
                    });
                });
        });
    });
}

function controlDataTables(connection) {

    return new Promise((resolve, reject) => {

        queryAsync(connection,`USE ${mysqlDatabase.database}`)
            .then(() => {
                Promise.all([
                    controlUsersTable(connection)
                ])
                    .then(results => {
                        resolve({
                            status: 'success',
                            message: `Veritabanı kontrolleri yapıldı ve bağlantı kuruldu.`
                        });
                        results.forEach(result => console.log(result.message))
                    })
                    .catch(reject);
            })
            .catch(error => reject({
                status: 'error',
                message: 'Veritabanı seçilemedi.',
                error: error
            }));

    })
}
