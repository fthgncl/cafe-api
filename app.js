(async () => {
    try {
        const { connection } = await require('./database/database')();
        if (connection) {
            require('./socket/main');
        }
    } catch (error) {
        console.error(error.message);
    }
})();
