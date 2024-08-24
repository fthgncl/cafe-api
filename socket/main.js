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
const getProduct = require('./getProduct');
const deleteUser = require('./deleteUser');
const deleteProduct = require('./deleteProduct');
const updateUser = require('./updateUser');
const updateProduct = require('./updateProduct');
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


        const payload = {
            ...dataJSON,
            tokenData : getTokenData(dataJSON.token)
        }

        const tokenIsActive = validateToken(payload);

        if (tokenIsActive) {
           updateToken(ws, payload);
        }

        if (payload.type === 'login') {
            if (!tokenIsActive) {
                login(ws, payload);
            } else {
                sendSocketMessage(ws, 'login', {error: 'Already logged in'});
            }
        } else if (!tokenIsActive) {
            sendSocketMessage(ws, payload.type, {error: 'Invalid or expired token'});
        } else {
            switch (payload.type) {

                // USER PROCESS
                case 'createUser':
                    createUser(ws, payload);
                    break;

                case 'deleteUser':
                    deleteUser(ws, payload);
                    break;

                case 'updateUser':
                    updateUser(ws, payload);
                    break;

                case 'getUsers':
                    getUsers(ws, payload);
                    break;

                case 'getUser':
                    getUser(ws, payload);
                    break;


                // PRODUCT PROCESS
                case 'createProduct':
                    createProduct(ws, payload);
                    break;

                case 'deleteProduct':
                    deleteProduct(ws, payload);
                    break;

                case 'updateProduct':
                    updateProduct(ws, payload);
                    break;

                case 'getProducts':
                    getProducts(ws, payload);
                    break;

                case 'getProduct':
                    getProduct(ws, payload);
                    break;


                // ORDER PROCESS
                case 'orderEntry':
                    orderEntry(ws, payload);
                    break;

                case 'getOrders':
                    getOrders(ws, payload);
                    break;

                case 'updateOrderPaymentStatus':
                    updateOrderPaymentStatus(ws, payload);
                    break;

                case 'updateOrderKitchenStatus':
                    updateOrderKitchenStatus(ws, payload);
                    break;


                default:
                    console.error('Unknown message type:', payload.type);
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