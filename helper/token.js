const { encryptData, decryptData} = require("./crypto");
const {sendSocketMessage} = require("./socket");
const { tokenLifeTimeMinute } = require('../config.json');

function validateToken({token,tokenData}) {

    try {
        if ( !token )
            return false;

        return 'exp' in tokenData && typeof tokenData.exp === 'number' && Date.now() < tokenData.exp;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
}

function getTokenData(token){
    try {
        return token ? JSON.parse(decryptData(token)) : {};
    } catch (error) {
        console.error('Token read failed:', error);
        return {};
    }
}

function updateToken(socket, {token , tokenData}){
    const exp = tokenLifeTimeMinute * 60000 + Date.now();
    const newTokenData = { ...tokenData, exp }
    const newToken = encryptData(JSON.stringify(newTokenData))
    const newUserProps = {
        token : newToken,
        oldToken : token,
        exp
    }
    sendSocketMessage(socket, 'updateToken', newUserProps);
}

module.exports = { validateToken, getTokenData, updateToken }