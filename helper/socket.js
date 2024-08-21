const WebSocket = require("ws");

let wss
function setWebSocketServer(server){
    wss = server;
}

async function sendSocketMessage(socket, type, message) {
    return await socket.send(JSON.stringify({type, message}));
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
