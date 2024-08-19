const {name, host, port} = require('../config.json').database;
const mongoose = require('mongoose');

module.exports = () => {
    return new Promise((resolve, reject) => {
        mongoose.connect(`${host}:${port}/${name}`);

        mongoose.connection.on('open', () => {
            resolve({
                connection: true,
                message: 'Database connection successful.'
            });
        });

        mongoose.connection.on('error', (error) => {
            reject({
                connection: false,
                message: 'Database connection failed.',
                error
            });
        });
    });
};