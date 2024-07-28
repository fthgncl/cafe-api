const WebSocket = require('ws');
const { port } = require('../config.json').socket;
const wss = new WebSocket.Server({ port });
const { decryptData } = require('../helper/crypto');

const login = require('./login');
const createUser = require('./createUser');

function parseJSON(message) {
    try {
        return JSON.parse(message);
    } catch (e) {
        console.error('Invalid JSON:', message);
        return null;
    }
}

function validateToken(token) {
    try {
        const tokenData = token ? JSON.parse(decryptData('token')) : {};
        return 'exp' in tokenData && typeof tokenData.exp === 'number' && Date.now() < tokenData.exp;
    } catch (error) {
        console.error('Token validation failed:', error);
        return false;
    }
}


wss.on('connection', (ws) => {

    ws.on('message', (data) => {
        const dataJSON = parseJSON(data);

        if (!dataJSON) {
            ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
            return;
        }

        console.log(validateToken(dataJSON.token));

        switch (dataJSON.type) {
            case 'login':
                login(ws, dataJSON);
                break;

            case 'createUser':
                createUser(ws, dataJSON);
                break;

            default:
                console.error('Unknown message type:', dataJSON.type);
                ws.send(JSON.stringify({ error: 'Unknown message type' }));
        }
    });

    ws.on('close', () => {

    });

});

console.log(`WebSocket server is running on ws://localhost:${port}`);
