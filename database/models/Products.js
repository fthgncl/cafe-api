const controlProductsTable = (connection) => {
    return new Promise((resolve, reject) => {
        // Products tablosunu oluştur
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productName VARCHAR(20) NOT NULL UNIQUE,
                productCategory VARCHAR(20) NOT NULL,
                createdDate DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;

        // Product Sizes tablosunu oluştur
        const createProductSizesTable = `
            CREATE TABLE IF NOT EXISTS product_sizes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productId INT NOT NULL,
                size VARCHAR(10) NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
                FOREIGN KEY (productId) REFERENCES products(id)
            );
        `;

        // Product Contents tablosunu oluştur
        const createProductContentsTable = `
            CREATE TABLE IF NOT EXISTS product_contents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productId INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                extraFee DECIMAL(10, 2) DEFAULT 0 CHECK (extraFee >= 0),
                FOREIGN KEY (productId) REFERENCES products(id)
            );
        `;

        // Tabloları oluştur
        connection.query(createProductsTable, (err, results) => {
            if (err) {
                return reject({
                    status: 'error',
                    message: 'Products tablosu oluşturulurken bir hata oluştu.',
                    error: err
                });
            }

            connection.query(createProductSizesTable, (err, results) => {
                if (err) {
                    return reject({
                        status: 'error',
                        message: 'Product Sizes tablosu oluşturulurken bir hata oluştu.',
                        error: err
                    });
                }

                connection.query(createProductContentsTable, (err, results) => {
                    if (err) {
                        return reject({
                            status: 'error',
                            message: 'Product Contents tablosu oluşturulurken bir hata oluştu.',
                            error: err
                        });
                    }

                    resolve({
                        status: 'success',
                        message: 'Products, Product Sizes ve Product Contents tabloları başarıyla oluşturuldu.'
                    });
                });
            });
        });
    });
};

module.exports = controlProductsTable;
