// Connect Data Base
require('./datebase/database')()
    .then(result => console.log(result.message))
    .catch(error => console.log(error.message))

// Start Web Socket
require('./socket/main');