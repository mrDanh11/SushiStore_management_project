const sql = require('mssql');
const { config,poolPromise } = require("../../config/db");


module.exports.getAllEmployees = async (req, res) => {
    try {
        const pool = await poolPromise;
        const { MaChiNhanh } = req.query; 

        let result;

        // nếu có MaChiNhanh, chỉ lấy nhân viên thuộc chi nhánh đó và DangLamViec = 1
        if (MaChiNhanh) {
            result = await pool.request()
                .input('MaChiNhanh', sql.Int, MaChiNhanh)
                .query(`
                    SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh, Luong
                    FROM nhan_vien
                    WHERE ChiNhanh = @MaChiNhanh AND DangLamViec = 1
                    ORDER BY HoTen ASC
                `);
        } else {
            
            result = await pool.request().query(`
                SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh, Luong
                FROM nhan_vien
                WHERE DangLamViec = 1
                ORDER BY ChiNhanh ASC
            `);
        }


        const branches = await pool.request().query(`
            SELECT MaCN, TenCN
            FROM chi_nhanh
        `);

        res.render('AdminPage/employees', {
            layout: 'Admin/AdminMain',
            title: 'Employee Management',
            employees: result.recordset, 
            branches: branches.recordset, 
            MaChiNhanh 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching employees');
    }
};




// Cập nhật controller để render form thêm nhân viên
module.exports.showAddEmployeeForm = async (req, res) => {
    try {
        const pool = await sql.connect(config);

        // Truy vấn bộ phận
        const departmentsResult = await pool.request().query('SELECT * FROM bo_phan');
        const departments = departmentsResult.recordset;

        // Truy vấn chi nhánh
        const branchesResult = await pool.request().query('SELECT * FROM chi_nhanh');
        const branches = branchesResult.recordset;

        // Render form thêm nhân viên với dữ liệu bộ phận và chi nhánh
        res.render('AdminPage/addEmployee', {
            layout: 'Admin/AdminMain',
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

    if (!MaNV || !HoTen || !SoNha || !Duong || !Quan || !ThanhPho || !NgaySinh || !Phai || !BoPhan || !ChiNhanh) {
        return res.status(400).send('All fields are required.');
    }

    try {
        const pool = await sql.connect(config);


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
            .input('MaNV', sql.Char(6), id)
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

        res.render('AdminPage/editEmployee', {
            employee: result.recordset[0],
            layout: 'Admin/AdminMain',
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
    const { MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, Phai, BoPhan, ChiNhanh, Luong } = req.body;

    if (!MaNV || !HoTen || !SoNha || !Duong || !Quan || !ThanhPho || !Phai || !BoPhan || !ChiNhanh || !Luong) {
        return res.render('editEmployee', {
            errorMessage: 'All fields are required.',
            employee: req.body 
        });
    }

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('MaNV', sql.Char(6), MaNV)
            .query(`
                SELECT ChiNhanh, BoPhan
                FROM nhan_vien
                WHERE MaNV = @MaNV
            `);

        const currentEmployee = result.recordset[0]; 
        if (!currentEmployee) {
            return res.status(404).send('Employee not found');
        }

        const currentChiNhanh = currentEmployee.ChiNhanh;
        const currentBoPhan = currentEmployee.BoPhan;

        // Nếu chi nhánh thay đổi, gọi procedure ChuyenNhanSu
        if (currentChiNhanh !== parseInt(ChiNhanh)) {
            await pool.request()
                .input('MaNV', sql.Char(6), MaNV)
                .input('MaChiNhanhMoi', sql.Int, ChiNhanh)
                .input('MaBoPhanMoi', sql.Int, BoPhan) 
                .execute('ChuyenNhanSu');
        }

        await pool.request()
            .input('MaNV', sql.Char(6), MaNV)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('SoNha', sql.NVarChar, SoNha)
            .input('Duong', sql.NVarChar, Duong)
            .input('Quan', sql.NVarChar, Quan)
            .input('ThanhPho', sql.NVarChar, ThanhPho)
            .input('Phai', sql.NVarChar, Phai)
            .input('Luong', sql.Float, Luong)
            .input('MaBoPhan', sql.Char(6), BoPhan)
            .query(`
                UPDATE nhan_vien
                SET HoTen = @HoTen, SoNha = @SoNha, Duong = @Duong, Quan = @Quan,
                    ThanhPho = @ThanhPho, Phai = @Phai, Luong = @Luong, BoPhan = @MaBoPhan
                WHERE MaNV = @MaNV
            `);

        res.redirect('/admin/employees'); 
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).send('Error updating employee');
    }
};







// // Xóa nhân viên
module.exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params; 
        console.log('Request Params:', req.params); 


        if (!id) {
            return res.status(400).send('Employee ID is required'); 
        }

        const pool = await poolPromise;

        await pool.request()
            .input('MaNV', sql.Char(6), id)
            .execute('xoa_nhan_vien');

        res.redirect('/admin/employees'); 
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send('Error deleting employee');
    }
};


// tìm kiếm nhân viên
module.exports.searchEmployee = async (req, res) => {
    const { searchTerm } = req.query; 

    try {
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('searchTerm', sql.NVarChar, `%${searchTerm}%`) 
            .query(`
                SELECT 
                    MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh, Luong
                FROM 
                    nhan_vien nv
                JOIN 
                    bo_phan bp 
                ON 
                    bp.MaBoPhan = nv.BoPhan
                WHERE 
                    (MaNV LIKE @searchTerm OR HoTen LIKE @searchTerm)
                    AND DangLamViec = 1 -- Chỉ lấy nhân viên đang làm việc
                ORDER BY 
                    ChiNhanh ASC
            `);

        res.render('AdminPage/employees', {
            layout: 'Admin/AdminMain',
            title: 'Employee Management',
            employees: result.recordset,
            searchTerm: searchTerm 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error searching employees');
    }
};