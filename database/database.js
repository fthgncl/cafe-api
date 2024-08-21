const mongoose = require('mongoose');
const {host, port, name} = require('../config.json').database;

module.exports = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(`${host}:${port}/${name}`);

        mongoose.connection.on('open', () => {
            resolve({
                connection: true,
                message: 'Veritabanı bağlantısı başarılı.'
            });
        });

        mongoose.connection.on('error', (error) => {
            reject({
                connection: false,
                message: 'Veritabanı bağlantısı kurulamadı.'
            });
        });
    });
}