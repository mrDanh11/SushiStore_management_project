// // controllers/admin/report.controller.js
// const sql = require('mssql');
// const { poolPromise } = require("../../config/database");

// module.exports.getRevenueReport = async (req, res) => {
//     try {
//         // Kết nối tới cơ sở dữ liệu
//         const pool = await poolPromise;

//         // Thống kê doanh thu theo tháng
//         const monthlyReport = await pool.request()
//             .query(`
//                 SELECT 
//                     YEAR(pd.NgayDat) AS Nam,
//                     MONTH(pd.NgayDat) AS Thang,
//                     cn.TenCN AS ChiNhanh,
//                     SUM(hd.TongTien) AS DoanhThuThang,
//                     SUM(hd.ThanhTien) AS DoanhThuSauGiamGia
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 JOIN chi_nhanh cn ON pd.MaCN = cn.MaCN
//                 GROUP BY YEAR(pd.NgayDat), MONTH(pd.NgayDat), cn.TenCN
//                 ORDER BY Nam DESC, Thang DESC, ChiNhanh;
//             `);

//         // Thống kê doanh thu theo quý
//         const quarterlyReport = await pool.request()
//             .query(`
//                 SELECT 
//                     YEAR(pd.NgayDat) AS Nam,
//                     (CASE 
//                         WHEN MONTH(pd.NgayDat) IN (1, 2, 3) THEN 'Q1'
//                         WHEN MONTH(pd.NgayDat) IN (4, 5, 6) THEN 'Q2'
//                         WHEN MONTH(pd.NgayDat) IN (7, 8, 9) THEN 'Q3'
//                         ELSE 'Q4'
//                     END) AS Quy,
//                     cn.TenCN AS ChiNhanh,
//                     SUM(hd.TongTien) AS DoanhThuQuy,
//                     SUM(hd.ThanhTien) AS DoanhThuSauGiamGia
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 JOIN chi_nhanh cn ON pd.MaCN = cn.MaCN
//                 GROUP BY YEAR(pd.NgayDat), 
//                          (CASE 
//                             WHEN MONTH(pd.NgayDat) IN (1, 2, 3) THEN 'Q1'
//                             WHEN MONTH(pd.NgayDat) IN (4, 5, 6) THEN 'Q2'
//                             WHEN MONTH(pd.NgayDat) IN (7, 8, 9) THEN 'Q3'
//                             ELSE 'Q4'
//                           END),
//                          cn.TenCN
//                 ORDER BY Nam DESC, Quy DESC, ChiNhanh;
//             `);

//         // Thống kê doanh thu theo năm
//         const yearlyReport = await pool.request()
//             .query(`
//                 SELECT 
//                     YEAR(pd.NgayDat) AS Nam,
//                     cn.TenCN AS ChiNhanh,
//                     SUM(hd.TongTien) AS DoanhThuNam,
//                     SUM(hd.ThanhTien) AS DoanhThuSauGiamGia
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 JOIN chi_nhanh cn ON pd.MaCN = cn.MaCN
//                 GROUP BY YEAR(pd.NgayDat), cn.TenCN
//                 ORDER BY Nam DESC, ChiNhanh;
//             `);

//         // Gửi báo cáo doanh thu tới trang render
//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Revenue Report',
//             monthlyReport: monthlyReport.recordset,  // Báo cáo theo tháng
//             quarterlyReport: quarterlyReport.recordset,  // Báo cáo theo quý
//             yearlyReport: yearlyReport.recordset,  // Báo cáo theo năm
//         });
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching revenue report');
//     }
// };


// controllers/admin/report.controller.js
const sql = require('mssql');
const { poolPromise } = require("../../config/database");

module.exports.getRevenueReport = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Truy vấn báo cáo tổng quan (tất cả)
        const result = await pool.request().query(`
            SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
            FROM hoa_don;
        `);

        res.render('admin/pages/reports', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Revenue Report',
            report: result.recordset // Dữ liệu báo cáo
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching revenue report');
    }
};

// Báo cáo theo tháng
module.exports.getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query; // Lấy month và year từ query string

        const pool = await poolPromise;
        // Truy vấn báo cáo theo tháng
        const result = await pool.request()
            .input('month', sql.Int, month)
            .input('year', sql.Int, year)
            .query(`
                SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
                FROM hoa_don hd
                JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
                WHERE MONTH(pd.NgayDat) = @month AND YEAR(pd.NgayDat) = @year;
            `);

        res.render('admin/pages/reports', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Monthly Revenue Report',
            report: result.recordset // Dữ liệu báo cáo tháng
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching monthly report');
    }
};

// Báo cáo theo quý
module.exports.getQuarterlyReport = async (req, res) => {
    try {
        const { quarter, year } = req.query; // Lấy quý và năm từ query string

        const pool = await poolPromise;
        // Truy vấn báo cáo theo quý
        const result = await pool.request()
            .input('quarter', sql.Int, quarter)
            .input('year', sql.Int, year)
            .query(`
                SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
                FROM hoa_don hd
                JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
                WHERE DATEPART(QUARTER, pd.NgayDat) = @quarter AND YEAR(pd.NgayDat) = @year;
            `);

        res.render('admin/pages/reports', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Quarterly Revenue Report',
            report: result.recordset // Dữ liệu báo cáo quý
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching quarterly report');
    }
};

// Báo cáo theo năm
module.exports.getYearlyReport = async (req, res) => {
    try {
        const { year } = req.query; // Lấy năm từ query string

        const pool = await poolPromise;
        // Truy vấn báo cáo theo năm
        const result = await pool.request()
            .input('year', sql.Int, year)
            .query(`
                SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
                FROM hoa_don hd
                JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
                WHERE YEAR(pd.NgayDat) = @year;
            `);

        res.render('admin/pages/reports', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Yearly Revenue Report',
            report: result.recordset // Dữ liệu báo cáo năm
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching yearly report');
    }
};



// // controllers/admin/report.controller.js
// const sql = require('mssql');
// const { poolPromise } = require("../../config/database");

// module.exports.getRevenueReport = async (req, res) => {
//     try {
//         const pool = await poolPromise;

//         // Truy vấn dữ liệu từ các bảng hoa_don và phieu_dat, sử dụng alias cho các bảng
//         const result = await pool.request().query(`
//             SELECT hd.MaPhieu, hd.TongTien, hd.GiamGia, hd.ThanhTien, hd.DiemTichLuy, pd.NgayDat, pd.MaCN
//             FROM hoa_don hd
//             JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu;
//         `);

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Revenue Report',
//             report: result.recordset // Dữ liệu báo cáo
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching revenue report');
//     }
// };


// // Báo cáo theo tháng
// module.exports.getMonthlyRevenueReport = async (req, res) => {
//     try {
//         const pool = await poolPromise;

//         const result = await pool.request().query(`
//             SELECT 
//                 YEAR(pd.NgayDat) AS Year, 
//                 MONTH(pd.NgayDat) AS Month, 
//                 SUM(hd.TongTien) AS TotalRevenue
//             FROM hoa_don hd
//             JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//             GROUP BY YEAR(pd.NgayDat), MONTH(pd.NgayDat)
//             ORDER BY Year DESC, Month DESC;
//         `);

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Monthly Revenue Report',
//             report: result.recordset
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching monthly revenue report');
//     }
// };


// // Báo cáo theo quý
// module.exports.getQuarterlyReport = async (req, res) => {
//     try {
//         const { quarter, year } = req.query; // Lấy quý và năm từ query string

//         const pool = await poolPromise;
//         // Truy vấn báo cáo theo quý
//         const result = await pool.request()
//             .input('quarter', sql.Int, quarter)
//             .input('year', sql.Int, year)
//             .query(`
//                 SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 WHERE DATEPART(QUARTER, pd.NgayDat) = @quarter AND YEAR(pd.NgayDat) = @year;
//             `);

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Quarterly Revenue Report',
//             report: result.recordset // Dữ liệu báo cáo quý
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching quarterly report');
//     }
// };

// // Báo cáo theo năm
// module.exports.getYearlyReport = async (req, res) => {
//     try {
//         const { year } = req.query; // Lấy năm từ query string

//         const pool = await poolPromise;
//         // Truy vấn báo cáo theo năm
//         const result = await pool.request()
//             .input('year', sql.Int, year)
//             .query(`
//                 SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 WHERE YEAR(pd.NgayDat) = @year;
//             `);

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Yearly Revenue Report',
//             report: result.recordset // Dữ liệu báo cáo năm
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching yearly report');
//     }
// };

