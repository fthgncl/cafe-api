const { name, host, port } = require('../config.json').database;
const mongoose = require('mongoose');

module.exports = async () => {
    try {
        await mongoose.connect(`${host}:${port}/${name}`);
        console.log('Veritabanı bağlantısı sağlandı.')
        return { connection: true, message: 'Veritabanı bağlantısı sağlandı.' };
    } catch (error) {
        return {
            connection: false,
            message: 'Veritabanı bağlantısı kurulamadı',
            error
        };
    }
};
