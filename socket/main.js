const WebSocket = require('ws');
const {port} = require('../config.json').socket;
const wss = new WebSocket.Server({port});
const {setWebSocketServer} = require("../helper/socket");
const {validateToken, getTokenData, updateToken} = require('../helper/token');
const {sendSocketMessage} = require('../helper/socket');

const login = require('./login');
const createUser = require('./createUser');
const createProduct = require('./createProduct');
const getProducts = require('./getProducts');
const getOrders = require('./getOrders');
const getUsers = require('./getUsers');
const getUser = require('./getUser');
const deleteUser = require('./deleteUser');
const updateUser = require('./updateUser');
const orderEntry = require('./orderEntry');
const updateOrderPaymentStatus = require('./updateOrderPaymentStatus');
const updateOrderKitchenStatus = require('./updateOrderKitchenStatus');

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

                case 'orderEntry':
                    orderEntry(ws, dataJSON);
                    break;

                case 'getOrders':
                    getOrders(ws, dataJSON);
                    break;

                case 'getUsers':
                    getUsers(ws, dataJSON);
                    break;

                case 'getUser':
                    getUser(ws, dataJSON);
                    break;

                case 'updateUser':
                    updateUser(ws, dataJSON);
                    break;

                case 'updateOrderPaymentStatus':
                    updateOrderPaymentStatus(ws, dataJSON);
                    break;

                case 'updateOrderKitchenStatus':
                    updateOrderKitchenStatus(ws, dataJSON);
                    break;

                case 'deleteUser':
                    deleteUser(ws, dataJSON);
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