(async () => {
    try {
        const {connection , status , message} = await require('./database/database')();
        console.log(message);
        if ( status !== 'success' )
            return;

        const startSocketServer = require('./socket/main');
        startSocketServer(connection);
    } catch (error) {
        console.log(error);
    }
})();