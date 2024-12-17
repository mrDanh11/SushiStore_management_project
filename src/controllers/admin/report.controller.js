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


// const sql = require('mssql');
// const { poolPromise } = require('../../config/database');

// module.exports.getRevenueReport = async (req, res) => {
//     const { type, branchId, date, month, quarter, year } = req.query;

//     try {
//         const pool = await poolPromise;

//         const branchesResult = await pool.query('SELECT MaCN, TenCN FROM chi_nhanh');
//         const branches = branchesResult.recordset;

//         if (!type) {
//             return res.render('admin/pages/reports', {
//                 layout: 'admin_layouts/mainAdmin',
//                 title: 'Revenue Report',
//                 branches,
//                 data: null,
//                 type: null,
//                 branchId: null,
//                 date: null,
//                 month: null,
//                 quarter: null,
//                 year: null
//             });
//         }

//         console.log('Query Params:', { type, branchId, date, month, quarter, year });


//         let result;
//         switch (type) {
//             case 'daily':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Ngay', sql.Date, date)
//                     .execute('xem_doanh_thu_chi_nhanh');
//                 break;
//             case 'monthly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Thang', sql.Int, month)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_thang');
//                 break;
//             case 'quarterly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Quy', sql.Int, quarter)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_quy');
//                 break;
//             case 'yearly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_nam');
//                 break;
//             default:
//                 return res.status(400).send('Invalid report type');
//         }

//         // Log the result to debug
//         console.log('Procedure Result:', result);

//         // Extract DoanhThu data
//         const data = result.recordsets[1] || []; // Second result set for DoanhThu

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Revenue Report',
//             branches,
//             data,
//             type,
//             branchId,
//             date,
//             month,
//             quarter,
//             year
//         });
//     } catch (error) {
//         console.error('Error fetching revenue report:', error);
//         res.status(500).send('Error fetching revenue report');
//     }
// };




// // controllers/admin/report.controller.js
// const sql = require('mssql');
// const { poolPromise } = require("../../config/database");

// module.exports.getRevenueReport = async (req, res) => {
//     try {
//         const pool = await poolPromise;
//         // Truy vấn báo cáo tổng quan (tất cả)
//         const result = await pool.request().query(`
//             SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
//             FROM hoa_don;
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
// module.exports.getMonthlyReport = async (req, res) => {
//     try {
//         const { month, year } = req.query; // Lấy month và year từ query string

//         const pool = await poolPromise;
//         // Truy vấn báo cáo theo tháng
//         const result = await pool.request()
//             .input('month', sql.Int, month)
//             .input('year', sql.Int, year)
//             .query(`
//                 SELECT MaPhieu, TongTien, GiamGia, ThanhTien, DiemTichLuy
//                 FROM hoa_don hd
//                 JOIN phieu_dat pd ON hd.MaPhieu = pd.MaPhieu
//                 WHERE MONTH(pd.NgayDat) = @month AND YEAR(pd.NgayDat) = @year;
//             `);

//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Monthly Revenue Report',
//             report: result.recordset // Dữ liệu báo cáo tháng
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error fetching monthly report');
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



// const sql = require('mssql');
// const { poolPromise } = require("../../config/database");

// // Hàm lấy doanh thu theo ngày, tháng, quý, năm
// module.exports.getRevenueReport = async (req, res) => {
//     const { type, branchId, date, month, quarter, year } = req.query;

//     // Danh sách giá trị hợp lệ
//     const validTypes = ['daily', 'monthly', 'quarterly', 'yearly'];

//     // Kiểm tra tham số "type"
//     if (!type || !validTypes.includes(type)) {
//         console.error(`Invalid type parameter: ${type}`);
//         return res.status(400).send('Invalid type parameter');
//     }

//     try {
//         const pool = await poolPromise;

//         // Fetch danh sách chi nhánh để gửi tới view
//         const branchesResult = await pool.query('SELECT MaCN, TenCN FROM chi_nhanh');
//         const branches = branchesResult.recordset;

//         let result;

//         console.log("Request Query: ", { type, branchId, date, month, quarter, year });


//         switch (type) {
//             case 'daily':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Ngay', sql.Date, date)
//                     .execute('xem_doanh_thu_chi_nhanh');
//                 console.log("Daily Report Result: ", result.recordset);
//                 break;
//             case 'monthly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Thang', sql.Int, month)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_thang');
//                 console.log("Monthly Report Result: ", result.recordset);
//                 break;
//             case 'quarterly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Quy', sql.Int, quarter)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_quy');
//                 console.log("Quarterly Report Result: ", result.recordset);
//                 break;
//             case 'yearly':
//                 result = await pool.request()
//                     .input('MaCN', sql.Int, branchId)
//                     .input('Nam', sql.Int, year)
//                     .execute('xem_doanh_thu_chi_nhanh_nam');
//                 console.log("Yearly Report Result: ", result.recordset);
//                 break;
//             default:
//                 throw new Error("Invalid report type");
//         }


//         res.render('admin/pages/reports', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Revenue Report',
//             data: result.recordset,
//             branches,
//             type, branchId, date, month, quarter, year
//         });
//     } catch (error) {
//         console.error("Detailed Error: ", error); // Ghi lại lỗi chi tiết
//         res.status(500).send('Error fetching revenue report');
//     }

// };



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




// controllers/admin/report.controller.js
const sql = require('mssql');
const { poolPromise } = require("../../config/database");

// a. Món bán chậm nhất theo chi nhánh
module.exports.getSlowestDishByBranch = async (req, res) => {
    const { branchId } = req.query;

    try {
        const pool = await poolPromise;

        let query = `
            SELECT 
                ma.TenMon, pd.MaCN, SUM(mmpd.SoLuong) AS SoLuong
            FROM 
                phieu_dat pd
            JOIN 
                ma_mon_phieu_dat mmpd ON pd.MaPhieu = mmpd.MaPhieu
            JOIN 
                mon_an ma ON mmpd.MaMon = ma.MaMon
        `;

        if (branchId) {
            query += ` WHERE pd.MaCN = @BranchId `;
        }

        query += `
            GROUP BY ma.TenMon, pd.MaCN
            HAVING SUM(mmpd.SoLuong) >= ALL (
                SELECT SUM(mmpd2.SoLuong)
                FROM phieu_dat pd2
                JOIN ma_mon_phieu_dat mmpd2 ON pd2.MaPhieu = mmpd2.MaPhieu
                WHERE pd2.MaCN = pd.MaCN
                GROUP BY mmpd2.MaMon
            )
        `;

        const request = pool.request();
        if (branchId) request.input('BranchId', sql.Int, branchId);

        const result = await request.query(query);

        const branches = await pool.request().query(`SELECT MaCN, TenCN FROM chi_nhanh`);

        res.render('admin/pages/slowestDishes', {
            title: 'Slowest Selling Dish - By Branch',
            layout: 'admin_layouts/mainAdmin',
            dishes: result.recordset,
            branches: branches.recordset,
            selectedBranch: branchId,
            filter: 'branch',
        });
    } catch (error) {
        console.error('Error fetching slowest dish by branch:', error);
        res.status(500).send('Error fetching data');
    }
};


// b. Món bán chậm nhất theo khu vực
module.exports.getSlowestDishByRegion = async (req, res) => {
    const { regionId } = req.query;

    try {
        const pool = await poolPromise;

        let query = `
            SELECT 
                ma.TenMon, kv.TenKhuVuc, kv.MaKhuVuc, SUM(mmpd.SoLuong) AS SoLuong
            FROM 
                phieu_dat pd
            JOIN 
                ma_mon_phieu_dat mmpd ON pd.MaPhieu = mmpd.MaPhieu
            JOIN 
                mon_an ma ON mmpd.MaMon = ma.MaMon
            JOIN 
                chi_nhanh cn ON pd.MaCN = cn.MaCN
            JOIN 
                khu_vuc kv ON cn.MaKhuVuc = kv.MaKhuVuc
        `;
        if (regionId) {
            query += ` WHERE kv.MaKhuVuc = @RegionId`;
        }

        query += `
            GROUP BY 
                ma.TenMon, kv.TenKhuVuc, kv.MaKhuVuc
            HAVING 
                SUM(mmpd.SoLuong) >= ALL (
                    SELECT SUM(mmpd2.SoLuong)
                    FROM phieu_dat pd2
                    JOIN ma_mon_phieu_dat mmpd2 ON pd2.MaPhieu = mmpd2.MaPhieu
                    JOIN chi_nhanh cn2 ON pd2.MaCN = cn2.MaCN
                    JOIN khu_vuc kv2 ON cn2.MaKhuVuc = kv2.MaKhuVuc
                    WHERE kv2.MaKhuVuc = kv.MaKhuVuc
                    GROUP BY mmpd2.MaMon
                )
        `;

        const request = pool.request();
        if (regionId) request.input('RegionId', sql.Int, regionId);

        const result = await request.query(query);

        const regions = await pool.request().query(`SELECT MaKhuVuc, TenKhuVuc FROM khu_vuc`);

        res.render('admin/pages/slowestDishes', {
            title: 'Slowest Selling Dish - By Region',
            layout: 'admin_layouts/mainAdmin',
            dishes: result.recordset,
            regions: regions.recordset,
            selectedRegion: regionId,
            filter: 'region',
        });
    } catch (error) {
        console.error('Error fetching slowest dish by region:', error);
        res.status(500).send('Error fetching data');
    }
};


// c. Món bán chậm nhất theo chi nhánh trong khoảng thời gian
module.exports.getSlowestDishByBranchAndDate = async (req, res) => {
    let { startDate, endDate, branchId } = req.query;

    try {
        const pool = await poolPromise;

        if (!startDate || isNaN(Date.parse(startDate))) {
            startDate = new Date().toISOString().split('T')[0]; 
        }
        if (!endDate || isNaN(Date.parse(endDate))) {
            endDate = new Date().toISOString().split('T')[0]; 
        }

        let query = `
            SELECT 
                ma.TenMon, pd.MaCN, SUM(mmpd.SoLuong) AS SoLuong
            FROM 
                phieu_dat pd
            JOIN 
                ma_mon_phieu_dat mmpd ON pd.MaPhieu = mmpd.MaPhieu
            JOIN 
                mon_an ma ON mmpd.MaMon = ma.MaMon
        `;

        // lọc theo ngày và chi nhánh
        const conditions = [];
        if (startDate && endDate) {
            conditions.push("pd.NgayDat BETWEEN @StartDate AND @EndDate");
        }
        if (branchId) {
            conditions.push("pd.MaCN = @BranchId");
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += `
            GROUP BY 
                ma.TenMon, pd.MaCN
            HAVING 
                SUM(mmpd.SoLuong) >= ALL (
                    SELECT SUM(mmpd2.SoLuong)
                    FROM phieu_dat pd2
                    JOIN ma_mon_phieu_dat mmpd2 ON pd2.MaPhieu = mmpd2.MaPhieu
                    WHERE pd2.MaCN = pd.MaCN
                    ${startDate && endDate ? "AND pd2.NgayDat BETWEEN @StartDate AND @EndDate" : ""}
                    GROUP BY mmpd2.MaMon
                )
        `;

        const request = pool.request();
        request.input('StartDate', sql.Date, startDate);
        request.input('EndDate', sql.Date, endDate);

        if (branchId) {
            request.input('BranchId', sql.Int, branchId);
        }

        const result = await request.query(query);

        // danh sách chi nhánh
        const branches = await pool.request().query(`SELECT MaCN, TenCN FROM chi_nhanh`);

        res.render('admin/pages/slowestDishes', {
            title: 'Slowest Selling Dish - By Branch and Date Range',
            layout: 'admin_layouts/mainAdmin',
            dishes: result.recordset,
            branches: branches.recordset,
            startDate,
            endDate,
            selectedBranch: branchId,
            filter: 'branch-date',
        });
    } catch (error) {
        console.error('Error fetching slowest dish by branch and date:', error);
        res.status(500).send('Error fetching data');
    }
};

