const controlProductsTable = (connection) => {
    return new Promise((resolve, reject) => {
        const createProductsTable = `
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                productName VARCHAR(20) NOT NULL UNIQUE,
                productCategory VARCHAR(20) NOT NULL,
                createdDate DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createProductSizesTable = `
            CREATE TABLE IF NOT EXISTS product_sizes (
                productId INT NOT NULL,
                size VARCHAR(10) NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
            );
        `;

        const createProductContentsTable = `
            CREATE TABLE IF NOT EXISTS product_contents (
                productId INT NOT NULL,
                name VARCHAR(50) NOT NULL,
                extraFee DECIMAL(10, 2) DEFAULT 0 CHECK (extraFee >= 0),
                FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
            );
        `;

        const createTables = async () => {
            try {
                await connection.query(createProductsTable);
                await connection.query(createProductSizesTable);
                await connection.query(createProductContentsTable);
                resolve({
                    status: 'success',
                    message: 'Products, Product Sizes ve Product Contents tabloları başarıyla oluşturuldu.'
                });
            } catch (error) {
                reject({
                    status: 'error',
                    message: 'Tablolar oluşturulurken bir hata oluştu.',
                    error
                });
            }
        };

        createTables();
    });
};

module.exports = controlProductsTable;
