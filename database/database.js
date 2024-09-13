// dbConnection.js
const mysql = require('mysql');
const {mysqlDatabase} = require('../config.json');
const controlUsersTable = require('./models/Users');
const controlOrdersTable = require('./models/Orders');
const controlProductsTable = require('./models/Products');
const controlSalesTable = require('./models/Sales');

let connection;
let isConnected = false;

function createConnection() {
    if (!connection) {
        connection = mysql.createConnection({
            host: mysqlDatabase.host,
            user: mysqlDatabase.user,
            password: mysqlDatabase.password,
            port: mysqlDatabase.port
        });

        // connection.queryAsync metodunu tanımlayın
        connection.queryAsync = function (query, values) {
            return new Promise((resolve, reject) => {
                this.query(query, values, (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(results);
                });
            });
        };

    }
    return connection;
}

function connectDatabase() {
    return new Promise((resolve, reject) => {
        const conn = createConnection();
        if (isConnected) {
            return resolve({
                status: 'success',
                message: 'Bağlantı zaten kurulu.',
                connection: conn
            });
        }

        conn.connect((err) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Veritabanı bağlantısı kurulamadı. Lütfen bağlantı bilgilerini kontrol edin.',
                    error: err
                });
            }

            // Veritabanının mevcut olup olmadığını kontrol et
            conn.queryAsync(`SHOW DATABASES LIKE '${mysqlDatabase.database}'`)
                .then(results => {
                    if (results.length !== 1) {
                        conn.queryAsync(`CREATE DATABASE ${mysqlDatabase.database}`)
                            .then(() => controlDataTables(conn)
                                .then(result => {
                                    isConnected = true;
                                    resolve(result);
                                })
                                .catch(reject))
                            .catch(error => reject({
                                status: 'error',
                                message: 'Veritabanı oluşturulamadı. Oluşturma işlemi sırasında bir hata meydana geldi.',
                                error
                            }));
                    } else {
                        controlDataTables(conn)
                            .then(result => {
                                isConnected = true;
                                resolve(result);
                            })
                            .catch(reject);
                    }
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

function controlDataTables(conn) {
    return new Promise((resolve, reject) => {
        conn.queryAsync(`USE ${mysqlDatabase.database}`)
            .then(() => {
                Promise.all([
                    controlUsersTable(conn),
                    controlProductsTable(conn),
                    controlOrdersTable(conn),
                    controlSalesTable(conn)
                ])
                    .then(results => {
                        resolve({
                            status: 'success',
                            message: `Veritabanı kontrolleri yapıldı ve bağlantı kuruldu.`,
                            connection: conn
                        });
                        results.forEach(result => console.log(result.message));
                    })
                    .catch(reject);
            })
            .catch(error => reject({
                status: 'error',
                message: 'Veritabanı seçilemedi.',
                error: error
            }));
    });
}

module.exports = {
    connectDatabase,
    isConnected,
    connection: createConnection()
};