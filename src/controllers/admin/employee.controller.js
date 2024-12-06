const sql = require('mssql');
const { sqlConfig, poolPromise } = require("../../config/database");

// Lấy tất cả nhân viên
// Lấy tất cả nhân viên
module.exports.getAllEmployees = async (req, res) => {
    try {
      const pool = await poolPromise;
      // Truy vấn dữ liệu nhân viên với đầy đủ thông tin
      const result = await pool.query(`
        SELECT MaNV, HoTen, SoNha, Duong, Quan, ThanhPho, NgaySinh, Phai, BoPhan, ChiNhanh
        FROM nhan_vien
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

// Thêm nhân viên
module.exports.addEmployee = async (req, res) => {
  try {
    const { maNV, tenNV, gioiTinh, ngaySinh, sdt, email, diaChi, chiNhanh, chucVu } = req.body;

    let pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('MaNV', sql.NVarChar, maNV)
      .input('TenNV', sql.NVarChar, tenNV)
      .input('GioiTinh', sql.NVarChar, gioiTinh)
      .input('NgaySinh', sql.Date, ngaySinh)
      .input('SDT', sql.NVarChar, sdt)
      .input('Email', sql.NVarChar, email)
      .input('DiaChi', sql.NVarChar, diaChi)
      .input('ChiNhanh', sql.Int, chiNhanh)
      .input('ChucVu', sql.NVarChar, chucVu)
      .query(`
        INSERT INTO nhan_vien (MaNV, TenNV, GioiTinh, NgaySinh, SDT, Email, DiaChi, ChiNhanh, ChucVu)
        VALUES (@MaNV, @TenNV, @GioiTinh, @NgaySinh, @SDT, @Email, @DiaChi, @ChiNhanh, @ChucVu)
      `);
    res.redirect('/admin/employees');
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).send('Error adding employee');
  }
};

// Lấy thông tin nhân viên để sửa
module.exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.query(`SELECT * FROM nhan_vien WHERE MaNV = '${id}'`);
    res.render('admin/pages/editEmployee', {
      employee: result.recordset[0],
      layout: 'admin_layouts/mainAdmin',
      title: 'Edit Employee',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching employee');
  }
};

// Sửa thông tin nhân viên
module.exports.editEmployee = async (req, res) => {
  const { id } = req.params;
  const { maNV, tenNV, gioiTinh, ngaySinh, sdt, email, diaChi, chiNhanh, chucVu } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('MaNV', sql.NVarChar, maNV)
      .input('TenNV', sql.NVarChar, tenNV)
      .input('GioiTinh', sql.NVarChar, gioiTinh)
      .input('NgaySinh', sql.Date, ngaySinh)
      .input('SDT', sql.NVarChar, sdt)
      .input('Email', sql.NVarChar, email)
      .input('DiaChi', sql.NVarChar, diaChi)
      .input('ChiNhanh', sql.Int, chiNhanh)
      .input('ChucVu', sql.NVarChar, chucVu)
      .input('MaNV', sql.NVarChar, id)
      .query(`
        UPDATE nhan_vien 
        SET TenNV = @TenNV, GioiTinh = @GioiTinh, NgaySinh = @NgaySinh, SDT = @SDT, Email = @Email, DiaChi = @DiaChi, ChiNhanh = @ChiNhanh, ChucVu = @ChucVu
        WHERE MaNV = @MaNV
      `);
    res.redirect('/admin/employees');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating employee');
  }
};

// Xóa nhân viên
module.exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    await pool.query(`DELETE FROM nhan_vien WHERE MaNV = '${id}'`);
    res.redirect('/admin/employees');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting employee');
  }
};
