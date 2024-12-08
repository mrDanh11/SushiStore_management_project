const sql = require('mssql');
const { sqlConfig, poolPromise } = require("../../config/database");

// Lấy tất cả nhân viên
module.exports.getAllEmployees = async (req, res) => {
    try {
        const pool = await poolPromise;
        // Truy vấn dữ liệu nhân viên với đầy đủ thông tin
        //   const result = await pool.query(`
        //     SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh
        //     FROM nhan_vien
        //   `);
        const result = await pool.query(`
        SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh
        FROM nhan_vien
        ORDER BY ChiNhanh ASC  -- Sắp xếp theo chi nhánh tăng dần
      `);

        res.render('admin/pages/employees', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Employee Management',
            employees: result.recordset
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching employees');
    }
};

// Cập nhật controller để render form thêm nhân viên
module.exports.showAddEmployeeForm = async (req, res) => {
    try {
        const pool = await sql.connect(sqlConfig);

        // Truy vấn bộ phận
        const departmentsResult = await pool.request().query('SELECT * FROM bo_phan');
        const departments = departmentsResult.recordset;

        // Truy vấn chi nhánh
        const branchesResult = await pool.request().query('SELECT * FROM chi_nhanh');
        const branches = branchesResult.recordset;

        // Render form thêm nhân viên với dữ liệu bộ phận và chi nhánh
        res.render('admin/pages/addEmployee', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Thêm Nhân Viên',
            departments: departments,
            branches: branches
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading employee form');
    }
};


module.exports.addEmployee = async (req, res) => {
    const { MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!MaNV || !HoTen || !SoNha || !Duong || !Quan || !ThanhPho || !NgaySinh || !Phai || !BoPhan || !ChiNhanh) {
        // Trả về form kèm theo thông báo lỗi
        return res.status(400).send('All fields are required.');
    }

    try {
        const pool = await sql.connect(sqlConfig);

        
        await pool.request()
            .input('MaNV', sql.NVarChar, MaNV)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('SoNha', sql.NVarChar, SoNha)
            .input('Duong', sql.NVarChar, Duong)
            .input('Quan', sql.NVarChar, Quan)
            .input('ThanhPho', sql.NVarChar, ThanhPho)
            .input('NgaySinh', sql.Date, NgaySinh)
            .input('Phai', sql.NVarChar, Phai)
            .input('BoPhan', sql.Int, BoPhan)
            .input('ChiNhanh', sql.Int, ChiNhanh)
            .query(`
                INSERT INTO nhan_vien (MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh)
                VALUES (@MaNV, @HoTen, @SoNha, @Duong, @Quan, @ThanhPho, @NgaySinh, @Phai, @BoPhan, @ChiNhanh)
            `);

        res.redirect('/admin/employees');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding employee');
    }
};




// Lấy thông tin nhân viên để sửa
module.exports.getEmployeeById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query(`SELECT * FROM nhan_vien WHERE MaNV = @MaNV`);

        if (result.recordset.length === 0) {
            return res.status(404).send('Employee not found');
        }
        //--
        // Truy vấn bộ phận
        const departmentsResult = await pool.request().query('SELECT * FROM bo_phan');
        const departments = departmentsResult.recordset;

        // Truy vấn chi nhánh
        const branchesResult = await pool.request().query('SELECT * FROM chi_nhanh');
        const branches = branchesResult.recordset;

        // // Lấy thông tin nhân viên
        // const employeeResult = await pool.request()
        //     .input('employeeId', sql.Int, employeeId)
        //     .query('SELECT * FROM nhan_vien WHERE MaNV = @employeeId');
        // const employee = employeeResult.recordset[0]; // Giả sử chỉ có 1 kết quả

        res.render('admin/pages/editEmployee', {
            employee: result.recordset[0],
            layout: 'admin_layouts/mainAdmin',
            title: 'Edit Employee',
            departments: departments,
            branches: branches,
            // employee: employee,
        });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).send('Error fetching employee');
    }
};


module.exports.editEmployee = async (req, res) => {
    const { id } = req.params;
    const { MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!MaNV || !HoTen || !SoNha || !Duong || !Quan || !ThanhPho || !NgaySinh || !Phai || !BoPhan || !ChiNhanh) {
        return res.render('editEmployee', {
            errorMessage: 'All fields are required.',
            employee: req.body  // Render lại dữ liệu đã nhập
        });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        await pool.request()
            .input('MaNV', sql.NVarChar, MaNV)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('SoNha', sql.NVarChar, SoNha)
            .input('Duong', sql.NVarChar, Duong)
            .input('Quan', sql.NVarChar, Quan)
            .input('ThanhPho', sql.NVarChar, ThanhPho)
            .input('NgaySinh', sql.Date, NgaySinh)
            .input('Phai', sql.NVarChar, Phai)
            .input('BoPhan', sql.Int, BoPhan)
            .input('ChiNhanh', sql.Int, ChiNhanh)
            .query(`
                UPDATE nhan_vien 
                SET HoTen = @HoTen, SoNha = @SoNha, Duong = @Duong, Quan = @Quan, ThanhPho = @ThanhPho, 
                    NgaySinh = @NgaySinh, Phai = @Phai, BoPhan = @BoPhan, ChiNhanh = @ChiNhanh
                WHERE MaNV = @MaNV
            `);

        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).send('Error updating employee');
    }
};




// // Xóa nhân viên
// module.exports.deleteEmployee = async (req, res) => {
//     const { id } = req.params;

//     try {
//         const pool = await sql.connect(sqlConfig);

//         // Xóa các bản ghi trong bảng dien_thoai_nhan_vien có MaNV = id
//         await pool.request()
//             .input('MaNV', sql.NVarChar, id)
//             .query(`DELETE FROM dbo.dien_thoai_nhan_vien WHERE MaNV = @MaNV`);

//         // Xóa các bản ghi trong bảng lich_su_lam_viec có MaNV = id
//         await pool.request()
//             .input('MaNV', sql.NVarChar, id)
//             .query(`DELETE FROM dbo.lich_su_lam_viec WHERE MaNV = @MaNV`);

//         // Xóa nhân viên khỏi bảng nhan_vien
//         await pool.request()
//             .input('MaNV', sql.NVarChar, id)
//             .query(`DELETE FROM dbo.nhan_vien WHERE MaNV = @MaNV`);

//         res.redirect('/admin/employees'); // Quay lại danh sách nhân viên
//     } catch (error) {
//         console.error('Error deleting employee:', error);
//         res.status(500).send('Error deleting employee');
//     }
// };


module.exports.deleteEmployee = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await sql.connect(sqlConfig);

        // Xóa các bản ghi trong bảng dat_ban_online có MaPhieu tham chiếu đến đơn hàng của nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.dat_ban_online WHERE MaPhieu IN (SELECT MaPhieu FROM dbo."order" WHERE NhanVienLap = @MaNV)'); // Xóa các bản ghi liên quan

        // Xóa các bản ghi trong bảng danh_gia có MaPhieu tham chiếu đến đơn hàng của nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.danh_gia WHERE MaPhieu IN (SELECT MaPhieu FROM dbo."order" WHERE NhanVienLap = @MaNV)'); // Xóa các bản ghi liên quan

        // Xóa các bản ghi trong bảng tham_gia_chuong_trinh có MaPhieu tham chiếu đến đơn hàng của nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.tham_gia_chuong_trinh WHERE MaPhieu IN (SELECT MaPhieu FROM dbo."order" WHERE NhanVienLap = @MaNV)'); // Xóa các bản ghi liên quan

        // Xóa các bản ghi trong bảng ma_mon_phieu_dat có MaPhieu tham chiếu đến đơn hàng của nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.ma_mon_phieu_dat WHERE MaPhieu IN (SELECT MaPhieu FROM dbo."order" WHERE NhanVienLap = @MaNV)'); // Xóa các bản ghi liên quan

        // Xóa các bản ghi trong bảng order_tai_cho mà có MaNV tham chiếu đến nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.order_tai_cho WHERE MaPhieu IN (SELECT MaPhieu FROM dbo."order" WHERE NhanVienLap = @MaNV)'); // Xóa các bản ghi liên quan

        // Xóa các bản ghi trong bảng order mà có MaNV tham chiếu đến nhân viên
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo."order" WHERE NhanVienLap = @MaNV'); // Xóa các đơn hàng liên quan

        // Xóa các bản ghi trong bảng dien_thoai_nhan_vien có MaNV = id
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.dien_thoai_nhan_vien WHERE MaNV = @MaNV');

        // Xóa các bản ghi trong bảng lich_su_lam_viec có MaNV = id
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.lich_su_lam_viec WHERE MaNV = @MaNV');

        // Xóa nhân viên khỏi bảng nhan_vien
        await pool.request()
            .input('MaNV', sql.NVarChar, id)
            .query('DELETE FROM dbo.nhan_vien WHERE MaNV = @MaNV');

        res.redirect('/admin/employees'); // Quay lại danh sách nhân viên
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send('Error deleting employee');
    }
};


// tìm kiếm nhân viên
module.exports.searchEmployee = async (req, res) => {
    const { searchTerm } = req.query; // Lấy từ query string

    try {
        const pool = await sql.connect(sqlConfig);

        // Truy vấn tìm kiếm nhân viên với các thông tin có thể tìm kiếm
        const result = await pool.request()
            .input('searchTerm', sql.NVarChar, `%${searchTerm}%`) // Dùng '%' để tìm kiếm với từ khóa bất kỳ
            .query(`
                SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh
                FROM nhan_vien
                WHERE MaNV LIKE @searchTerm OR HoTen LIKE @searchTerm
                ORDER BY ChiNhanh ASC
            `);

        res.render('admin/pages/employees', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Employee Management',
            employees: result.recordset,
            searchTerm: searchTerm // Truyền từ khóa tìm kiếm về view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error searching employees');
    }
};



