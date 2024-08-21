console.log('--- Cafe API ---');
(async () => {
    try {
        const { connection, message } = await require('./database/database')();
        console.log(message);
        if (connection) {
            require('./socket/main');
        }
    } catch (error) {
        console.log(error.message);
    }
})();