const { connectDatabase } = require('./database/database');

(async () => {
    try {
        const {connection , status , message} = await connectDatabase();

        console.log(message);
        if ( status !== 'success' )
            return;

        const startSocketServer = require('./socket/main');
        startSocketServer(connection);
    } catch (error) {
        console.log(error);
    }
})();