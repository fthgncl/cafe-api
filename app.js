// Connect Data Base
require('./database/database')()
    .then(result => {
        console.log(result.message);

        // Eğer bağlantı başarılıysa socket'i çalıştır
        if (result.connection) {
            require('./socket/main');
        }
    })
    .catch(error => console.error(error.message));