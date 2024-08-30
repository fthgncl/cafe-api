const mysql = require('mysql');
const { mysqlDatabase } = require('../config.json');
const controlUsersTable = require('./models/Users');

const connection = mysql.createConnection({
    host: mysqlDatabase.host,
    user: mysqlDatabase.user,
    password: mysqlDatabase.password,
    port: mysqlDatabase.port,
    database: mysqlDatabase.database
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
            connection.query(`SHOW DATABASES LIKE '${mysqlDatabase.database}'`, (err, results) => {
                if (err) {
                    return reject({
                        status: 'error',
                        message: 'Veritabanı kontrolü sırasında bir hata oluştu. Hata detaylarını inceleyin.',
                        error: err
                    });
                }

                if (results.length === 0) {
                    // Veritabanı mevcut değilse oluştur
                    connection.query(`CREATE DATABASE ${mysqlDatabase.database}`, (err) => {
                        if (err) {
                            return reject({
                                status: 'error',
                                message: 'Veritabanı oluşturulamadı. Oluşturma işlemi sırasında bir hata meydana geldi.',
                                error: err
                            });
                        }
                        // Veritabanı oluşturulduktan sonra tabloları kontrol et ve oluştur
                        controlUsersTable(connection).then(resolve).catch(reject);
                    });
                } else {
                    // Veritabanı mevcutsa tabloları kontrol et ve oluştur
                    controlUsersTable(connection).then(resolve).catch(reject);
                }
            });
        });
    });
};
