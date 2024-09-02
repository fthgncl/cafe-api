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


// TODO : Ürün , sipariş , kullanıcı işlemlerinde gelen veriyi kontrol et

// TODO : Ürün, sipariş ve kullanıcı silme işlemlerine göz at. Birbirlerine referans oldukları için silme işlemi engellenebiliyor.
// TODO : Hatta bilgilerin bazıları siliniyor bazıları kalıyor. Örneğin ürün silinmeye çalışıldığında içeriği ve boyutları siliniyor ama kendisi silinmiyor
// TODO : Bir ürün silindiğinde siparişin silinmeyeceğinden emin ol. Ürünün bulunduğu tüm siparişler silinirse istatistiklerde yanlış olur. Ürün takibi de