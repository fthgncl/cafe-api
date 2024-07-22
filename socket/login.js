
const validUsername = 'admin';  // TODO: Veri tabanına al
const validPassword = 'password123';  // TODO: Veri tabanına al

module.exports = function login(socket,message){

    console.log('Socket mesajı geldi : ',message)


    // const decryptedMessage = decrypt(message)
    //
    // // İlk gelen mesaj kimlik doğrulama bilgisi olmalıdır
    // if (decryptedMessage.type === 'auth') {
    //     if (decryptedMessage.username === validUsername && decryptedMessage.password === validPassword) {
    //         socket.isAuthenticated = true;
    //         socket.send(JSON.stringify(encrypt('Authenticated')));
    //     } else {
    //         socket.send(JSON.stringify(encrypt('Authentication Failed')));
    //         socket.close();
    //     }
    // } else if (socket.isAuthenticated) {
    //     // Kimlik doğrulandıktan sonra gelen mesajları işleme
    //     console.log(`Received message => ${decryptedMessage}`);
    // }
}