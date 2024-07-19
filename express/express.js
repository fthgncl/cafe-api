#!/usr/bin/env node

const debug = require('debug')('cafe-api:server');
const http = require('http');
const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const logger = require('morgan');   // Bu paket gelen isteklerin konsoldan çıktı olarak verilmesini sağlamaktadır.

const indexRouter = require('./routesControl');
const notFoundRouter = require('../routes/notFound');
const configs = require('../config.json');
const {port} = configs.express;
const {maxFileSizeMB} = configs.uploadConfig;

const app = express();
app.use(cors());
app.set('port', port);

app.use(logger('dev'));
app.use(express.json({ limit: `${maxFileSizeMB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${maxFileSizeMB}mb` }));
app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use('/', indexRouter);
app.use('*',notFoundRouter);

//catch 404 and forward to error handler
app.use((req, res, next) => next(createError(404)));

// error handler
app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


const server = http.createServer(app);

server.listen(process.env.PORT || port);
server.on('error', onError);
server.on('listening', onListening);

// Normalize a port into a number, string, or false.
function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

module.exports = app;