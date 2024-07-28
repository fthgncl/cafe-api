const CryptoJS = require('crypto-js');
const { cryptoSecretKey } = require('../config.json');

function encryptData(data) {
    try {
        // Veriyi JSON string'ine dönüştür ve şifrele
        return CryptoJS.AES.encrypt(JSON.stringify(data), cryptoSecretKey).toString();
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}

function decryptData(encryptedData) {
    try {
        // Şifrelenmiş veriyi çöz ve JSON formatında döndür
        const bytes = CryptoJS.AES.decrypt(encryptedData, cryptoSecretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
}

module.exports = { encryptData, decryptData };
