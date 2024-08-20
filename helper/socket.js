const WebSocket = require("ws");

let wss
function setWebSocketServer(server){
    wss = server;
}

function sendSocketMessage(socket, type, message) {
    socket.send(JSON.stringify({type, message}));
}

function sendMessageToAllClients(messageType, message) {
    const fullMessage = { type: messageType, message };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(fullMessage));
        }
    });
}

module.exports = { sendSocketMessage, sendMessageToAllClients, setWebSocketServer };
