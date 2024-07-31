const WebSocket = require('ws');
const {port} = require('../config.json').socket;
const wss = new WebSocket.Server({port});
const {setWebSocketServer} = require("../helper/databaseChangesNotifier");
const {validateToken, getTokenData, updateToken} = require('../helper/token');
const {sendSocketMessage} = require('../helper/socket');

const login = require('./login');
const createUser = require('./createUser');
const createProduct = require('./createProduct');
const getProducts = require('./getProducts');

setWebSocketServer(wss);

function parseJSON(message) {

    try {
        return JSON.parse(message);
    } catch (e) {
        console.error('Invalid JSON:', message);
        return null;
    }
}

wss.on('connection', (ws) => {
    console.log('Cihaz Bağlandı');
    ws.on('message', (data) => {
        let dataJSON = parseJSON(data);

        if (!dataJSON) {
            sendSocketMessage(ws, 'messageError', {error: 'Invalid JSON format'});
            return;
        }

        const tokenData = getTokenData(dataJSON.token);
        const tokenIsActive = validateToken(tokenData);

        dataJSON.token = tokenData;

        if (tokenIsActive) {
           updateToken(ws, tokenData);
        }


        if (dataJSON.type === 'login') {
            if (!tokenIsActive) {
                login(ws, dataJSON);
            } else {
                sendSocketMessage(ws, 'login', {error: 'Already logged in'});
            }
        } else if (!tokenIsActive) {
            sendSocketMessage(ws, dataJSON.type, {error: 'Invalid or expired token'});
        } else {
            switch (dataJSON.type) {
                case 'createUser':
                    createUser(ws, dataJSON);
                    break;

                case 'createProduct':
                    createProduct(ws, dataJSON);
                    break;

                case 'getProducts':
                    getProducts(ws, dataJSON);
                    break;

                default:
                    console.error('Unknown message type:', dataJSON.type);
                    sendSocketMessage(ws, 'messageError', {error: 'Unknown message type'});
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Burada bağlantı kapandığında yapılacak işlemler ekleyebilirsiniz
    });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);