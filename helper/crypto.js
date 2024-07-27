const CryptoJS = require('crypto-js');
const { cryptoSecretKey } = require('../config.json');

function encryptData(data) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), cryptoSecretKey).toString();
}

function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, cryptoSecretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

module.exports = { encryptData, decryptData };
