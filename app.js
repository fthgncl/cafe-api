(async () => {
    try {
        const { connection, message } = await require('./database/database')();
        console.log(message);
        if (!connection)
            return;

        require('./socket/main');
    } catch (error) {
        console.log(error);
    }
})();