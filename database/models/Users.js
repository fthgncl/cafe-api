const controlUsersTable = (connection) => {
    return new Promise((resolve, reject) => {
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                firstname VARCHAR(15) NOT NULL,
                lastname VARCHAR(15) NOT NULL,
                username VARCHAR(15) NOT NULL UNIQUE,
                phone VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                permissions VARCHAR(255) NOT NULL DEFAULT '',
                CHECK (CHAR_LENGTH(firstname) >= 3 AND CHAR_LENGTH(firstname) <= 15),
                CHECK (CHAR_LENGTH(lastname) >= 3 AND CHAR_LENGTH(lastname) <= 15),
                CHECK (CHAR_LENGTH(username) >= 3 AND CHAR_LENGTH(username) <= 15)
            );
        `;

        // Tabloyu oluştur
        connection.query(createUsersTable, (err, results) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Users tablosu oluşturulurken bir hata oluştu.',
                    error: err
                });
            }

            // Tablo oluşturulduktan sonra, kayıt olup olmadığını kontrol et
            const checkRecords = 'SELECT COUNT(*) AS count FROM users';
            connection.query(checkRecords, (err, results) => {
                if (err) {
                    return reject({
                        status: 'error',
                        message: 'Kayıt kontrolü sırasında bir hata oluştu.',
                        error: err
                    });
                }

                if (results[0].count === 0) {
                    // Tablo boşsa yönetici kaydı
                    const inserDefaultAdminUser = `
                        INSERT INTO users (firstname, lastname, username, phone, password, permissions)
                        VALUES ('admin', 'admin', 'admin', '1234567890', 'admin', 'a');
                    `;

                    connection.query(inserDefaultAdminUser, (err) => {
                        if (err) {
                            return reject({
                                status: 'error',
                                message: 'Admin kullanıcı oluşturulurken bir hata oluştu.',
                                error: err
                            });
                        }
                        resolve({
                            status: 'success',
                            message: 'Users tablosu oluşturuldu ve admin kullanıcı başarıyla eklendi.'
                        });
                    });
                } else {
                    resolve({
                        status: 'success',
                        message: 'Users tablosu mevcut ve kayıt bulunuyor.'
                    });
                }
            });
        });
    });
};

module.exports = controlUsersTable;
