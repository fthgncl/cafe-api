const {connection} = require('../database/database');
const {sendSocketMessage} = require("../helper/socket");
const {checkUserRoles} = require("../helper/permissionManager");

async function getAnalyticsData(socket, {message, type, tokenData}) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['report_viewer']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Raporları görüntüleyebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }


        let {startDate, endDate} = message;
        
        const endDateObj = new Date(endDate);
        endDateObj.setDate(endDateObj.getDate() + 1);
        endDate = endDateObj.toISOString(); // ISO formatında güncellenmiş endDate

        try {
            const sales = await connection.queryAsync(`SELECT * FROM sales WHERE createdDate BETWEEN ? AND ?`, [startDate, endDate]);
            const [orderData] = await connection.queryAsync(`
                SELECT COUNT(id) AS count 
                FROM orders 
                WHERE (paymentStatus = 'Hediye' OR paymentStatus = 'Ödendi') 
                AND kitchenStatus = 'Hazırlandı'
                AND createdDate BETWEEN ? AND ?`, [startDate, endDate]);

            await sendSocketMessage(socket, type, {
                status: 'success',
                message: 'Satış kayıtları başarıyla alındı.',
                data: {
                    sales,
                    orderCount: orderData.count
                }
            });

        } catch (error) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Veriler okunurken hata oluştu.',
                error
            });
        }

    } catch (error) {
        console.error('Satış kayıtları veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Satış kayıtları tabanından alınamadı.'
        });
    }
}

module.exports = getAnalyticsData;
