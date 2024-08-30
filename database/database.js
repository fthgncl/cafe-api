const mysql = require('mysql');
const { mysqlDatabase } = require('../config.json');

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
                    connection: false,
                    message: 'Veritabanı bağlantısı kurulamadı. Lütfen bağlantı bilgilerini kontrol edin.',
                    error: err
                });
            }

            // Veritabanının mevcut olup olmadığını kontrol et
            connection.query(`SHOW DATABASES LIKE '${mysqlDatabase.database}'`, (err, results) => {
                if (err) {
                    return reject({
                        connection: false,
                        message: 'Veritabanı kontrolü sırasında bir hata oluştu. Hata detaylarını inceleyin.',
                        error: err
                    });
                }

                if (results.length === 0) {
                    // Veritabanı mevcut değilse oluştur
                    connection.query(`CREATE DATABASE ${mysqlDatabase.database}`, (err) => {
                        if (err) {
                            return reject({
                                connection: false,
                                message: 'Veritabanı oluşturulamadı. Oluşturma işlemi sırasında bir hata meydana geldi.',
                                error: err
                            });
                        }
                        resolve({
                            connection: true,
                            message: 'Veritabanı başarıyla oluşturuldu ve bağlantı sağlandı.'
                        });
                    });
                } else {
                    resolve({
                        connection: true,
                        message: 'Veritabanı zaten mevcut ve bağlantı başarılı bir şekilde gerçekleştirildi.'
                    });
                }
            });
        });
    });
};
