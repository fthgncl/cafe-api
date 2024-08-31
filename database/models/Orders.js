const controlOrdersTable = (connection) => {
    return new Promise((resolve, reject) => {
        // Orders tablosunu oluştur
        const createOrdersTable = `
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                customerName VARCHAR(50) NOT NULL,
                orderNote VARCHAR(255),
                paymentStatus ENUM('Ödendi', 'Daha Sonra Ödenecek', 'Hediye', 'İptal Edildi') NOT NULL,
                discount DECIMAL(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
                discountedPrice DECIMAL(10, 2) DEFAULT 0 CHECK (discountedPrice >= 0),
                totalPrice DECIMAL(10, 2) NOT NULL CHECK (totalPrice >= 0),
                kitchenStatus ENUM('Beklemede', 'Hazırlanıyor', 'Hazırlandı') NOT NULL DEFAULT 'Beklemede',
                createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                userId INT NOT NULL,
                FOREIGN KEY (userId) REFERENCES users(id)
            );
        `;

        // Order Items tablosunu oluştur
        const createOrderItemsTable = `
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orderId INT NOT NULL,
                productId INT NOT NULL,
                quantity INT NOT NULL CHECK (quantity >= 1),
                size VARCHAR(10) NOT NULL,
                content VARCHAR(255),
                FOREIGN KEY (orderId) REFERENCES orders(id),
                FOREIGN KEY (productId) REFERENCES products(id)
            );
        `;

        // Tabloları oluştur
        connection.query(createOrdersTable, (err, results) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Orders tablosu oluşturulurken bir hata oluştu.',
                    error: err
                });
            }

            connection.query(createOrderItemsTable, (err, results) => {
                if (err) {
                    return reject({
                        status: 'error',
                        message: 'Order Items tablosu oluşturulurken bir hata oluştu.',
                        error: err
                    });
                }

                resolve({
                    status: 'success',
                    message: 'Orders ve Order Items tabloları başarıyla oluşturuldu.'
                });
            });
        });
    });
};

module.exports = controlOrdersTable;
