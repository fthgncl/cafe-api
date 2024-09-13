const { connection } = require('../database/database');
const { sendSocketMessage } = require("../helper/socket");
const { checkUserRoles } = require("../helper/permissionManager");

async function getSales(socket, { message, type, tokenData }) {
    try {
        const hasRequiredRoles = await checkUserRoles(tokenData.id, ['report_viewer']);

        if (!hasRequiredRoles) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Raporları görüntüleyebilmek için yeterli yetkiniz bulunmuyor.'
            });
            return;
        }


        let { startDate, endDate } = message;

        // startDate ve endDate aynı ise endDate'e bir gün ekle
        if (startDate === endDate) {
            const endDateObj = new Date(endDate);
            endDateObj.setDate(endDateObj.getDate() + 1);
            endDate = endDateObj.toISOString(); // ISO formatında güncellenmiş endDate
        }

        // Tarih aralığına göre satışları alacak sorgu
        const salesQuery = `
            SELECT * FROM sales
            WHERE createdDate BETWEEN ? AND ?
        `;

        const sales = await connection.queryAsync(salesQuery, [startDate, endDate]);

        if (!sales || sales.length === 0) {
            await sendSocketMessage(socket, type, {
                status: 'error',
                message: 'Bu tarih aralığında satış kaydı bulunamadı.'
            });
            return;
        }

        // Satış kayıtları başarıyla alındı, kullanıcıya gönderiliyor
        await sendSocketMessage(socket, type, {
            status: 'success',
            message: 'Satış kayıtları başarıyla alındı.',
            sales
        });

    } catch (error) {
        console.error('Satış kayıtları veri tabanından alınamadı:', error);
        await sendSocketMessage(socket, type, {
            status: 'error',
            message: 'Satış kayıtları tabanından alınamadı.'
        });
    }
}

module.exports = getSales;
