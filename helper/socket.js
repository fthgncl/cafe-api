function sendSocketMessage(socket, type, message) {
    socket.send(JSON.stringify({type, message}));
}

module.exports = { sendSocketMessage };
