const onlineUsers = new Map();

function userSetOnline(user){

    const { password, ...userWithoutPassword } = user.toObject();

    onlineUsers.set(user.id, 500);
}

function sendSocketMessage(socket, type, message) {
    socket.send(JSON.stringify({type, message}));
}

module.exports = { sendSocketMessage };
