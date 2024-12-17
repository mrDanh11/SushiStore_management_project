// controllers/admin/report.controller.js
const sql = require('mssql');
const { poolPromise } = require("../../config/database");

module.exports = {
    // Hiển thị users và thẻ
    getUsers: async (req, res) => {
        try {
            const pool = await poolPromise;

            const users = await pool.request().query(`
            SELECT kh.CCCD, kh.HoTen, kh.SDT, kh.Email, t.MaThe, t.NgayLap, t.LoaiThe, t.TieuDung, t.NhanVienLap, t.CapNhat
            FROM khach_hang kh
            RIGHT JOIN the t ON kh.CCCD = t.CCCD
        `);

            // định dạng lại ngày tháng
            const formattedUsers = users.recordset.map(user => ({
                ...user,
                NgayLap: user.NgayLap ? new Date(user.NgayLap).toISOString().split('T')[0] : '',
                CapNhat: user.CapNhat ? new Date(user.CapNhat).toISOString().split('T')[0] : ''
            }));

            res.render('admin/pages/users', {
                title: 'User Management',
                layout: 'admin_layouts/mainAdmin',
                // users: users.recordset,
                users: formattedUsers,
            });
        } catch (error) {
            console.error('Error fetching users and cards:', error);
            res.status(500).send('Error fetching users');
        }
    },


    // Thêm thẻ mới
    addCard: async (req, res) => {
        const { MaThe, CCCD, NgayLap, LoaiThe, NhanVienLap } = req.body;

        try {
            const pool = await poolPromise;

            await pool.request()
                .input('MaThe', sql.Char(5), MaThe)
                .input('CCCD', sql.Char(12), CCCD)
                .input('NgayLap', sql.DateTime, NgayLap)
                .input('LoaiThe', sql.VarChar(10), LoaiThe)
                .input('NhanVienLap', sql.Char(5), NhanVienLap)
                .query(`
                    INSERT INTO the (MaThe, CCCD, NgayLap, LoaiThe, NhanVienLap, CapNhat)
                    VALUES (@MaThe, @CCCD, @NgayLap, @LoaiThe, @NhanVienLap, GETDATE())
                `);

            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error adding card:', error);
            res.status(500).send('Error adding card');
        }
    },

    // Xóa thẻ
    deleteCard: async (req, res) => {
        const { MaThe } = req.params;

        try {
            const pool = await poolPromise;

            await pool.request()
                .input('MaThe', sql.Char(5), MaThe)
                .query('DELETE FROM the WHERE MaThe = @MaThe');

            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error deleting card:', error);
            res.status(500).send('Error deleting card');
        }
    },

    // Sửa thông tin thẻ
    editCard: async (req, res) => {
        const { MaThe } = req.params;
        const { NgayLap, LoaiThe, TieuDung } = req.body;

        try {
            const pool = await poolPromise;

            await pool.request()
                .input('MaThe', sql.Char(5), MaThe)
                .input('NgayLap', sql.DateTime, NgayLap)
                .input('LoaiThe', sql.VarChar(10), LoaiThe)
                .input('TieuDung', sql.Float, TieuDung)
                .query(`
                    UPDATE the 
                    SET NgayLap = @NgayLap, LoaiThe = @LoaiThe, TieuDung = @TieuDung, CapNhat = GETDATE()
                    WHERE MaThe = @MaThe
                `);

            res.redirect('admin/pages/users');
        } catch (error) {
            console.error('Error updating card:', error);
            res.status(500).send('Error updating card');
        }
    },

    searchUsers: async (req, res) => {
        try {
            const pool = await poolPromise;
    
            const { searchBy, searchInput } = req.query;
    
            let query = `
                SELECT kh.CCCD, kh.HoTen, kh.SDT, kh.Email, t.MaThe, t.NgayLap, t.LoaiThe, t.TieuDung, t.NhanVienLap, t.CapNhat
                FROM khach_hang kh
                RIGHT JOIN the t ON kh.CCCD = t.CCCD
            `;
    
            if (searchBy && searchInput) {
                if (searchBy === 'CCCD') query += ` WHERE kh.CCCD LIKE '%${searchInput}%'`;
                if (searchBy === 'HoTen') query += ` WHERE kh.HoTen LIKE N'%${searchInput}%'`;
                if (searchBy === 'LoaiThe') query += ` WHERE t.LoaiThe LIKE '%${searchInput}%'`;
                if (searchBy === 'MaThe') query += ` WHERE t.MaThe LIKE '%${searchInput}%'`;
            }
    
            const users = await pool.request().query(query);
    
            // định dạng ngày thành 'YYYY-MM-DD'
            const formattedUsers = users.recordset.map(user => ({
                ...user,
                NgayLap: user.NgayLap ? new Date(user.NgayLap).toISOString().split('T')[0] : '',
                CapNhat: user.CapNhat ? new Date(user.CapNhat).toISOString().split('T')[0] : ''
            }));
    
            res.render('admin/pages/users', {
                title: 'User Management',
                layout: 'admin_layouts/mainAdmin',
                users: formattedUsers,
            });
        } catch (error) {
            console.error('Error searching users:', error);
            res.status(500).send('Error searching users');
        }
    },
    

};
