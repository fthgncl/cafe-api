const controlSalesTable = (connection) => {
    return new Promise((resolve, reject) => {
        const createSalesTable = `
            CREATE TABLE IF NOT EXISTS sales (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orderId INT NOT NULL,
                productId INT NULL,
                contentName VARCHAR(50),
                quantity INT NOT NULL CHECK (quantity >= 1),
                discount DECIMAL(5, 2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
                discountedPrice DECIMAL(10, 2) DEFAULT 0 CHECK (discountedPrice >= 0),
                totalPrice DECIMAL(10, 2) NOT NULL CHECK (totalPrice >= 0),
                createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
            );
        `;

        connection.query(createSalesTable, (err, results) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Sales tablosu oluşturulurken bir hata oluştu.',
                    error: err
                });
            }

            resolve({
                status: 'success',
                message: 'Sales tablosu başarıyla oluşturuldu.'
            });
        });
    });
};

module.exports = controlSalesTable;
