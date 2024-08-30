(async () => {
    try {
        const { connection, message } = await require('./database/database')();
        console.log(message);
        if (!connection)
            return;

        const startSocketServer = require('./socket/main');
        startSocketServer(connection)
    } catch (error) {
        console.log(error);
    }
})();