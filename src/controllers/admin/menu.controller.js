const sql = require('mssql');
const { poolPromise } = require('../../config/database');

module.exports.getMenuPage = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Lấy danh sách khu vực
        const regionsResult = await pool.query('SELECT MaKhuVuc, TenKhuVuc FROM khu_vuc');
        const regions = regionsResult.recordset;

        // Lấy danh sách chi nhánh
        const branchesResult = await pool.query('SELECT MaCN, TenCN FROM chi_nhanh');
        const branches = branchesResult.recordset;

        // Lấy danh sách món ăn (nếu cần thêm lọc theo regionId hoặc branchId)
        const { regionId, branchId } = req.query;
        let dishesQuery = `
            SELECT ma.MaMon, ma.TenMon, ma.Gia, ma.Loai
            FROM mon_an ma
        `;

        if (regionId) {
            dishesQuery += `
                INNER JOIN mon_an_khu_vuc makv ON ma.MaMon = makv.MaMon
                WHERE makv.MaKhuVuc = @regionId
            `;
        }

        if (branchId) {
            dishesQuery += `
                INNER JOIN mon_an_chi_nhanh macn ON ma.MaMon = macn.MaMon
                WHERE macn.MaCN = @branchId
            `;
        }

        const dishesResult = await pool.request()
            .input('regionId', sql.Int, regionId || null)
            .input('branchId', sql.Int, branchId || null)
            .query(dishesQuery);

        res.render('admin/pages/menu', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Menu Management',
            regions,
            branches,
            dishes: dishesResult.recordset,
            regionId,
            branchId,
        });
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).send('Error fetching menu');
    }
};

module.exports.renderAddDishForm = async(req, res)=>{
    res.render('admin/pages/addDish', {
        layout: 'admin_layouts/mainAdmin',
        title: 'Menu Management',
    });
}

// // Thêm món ăn
// module.exports.addDish = async (req, res) => {
//     const { MaMon, TenMon, Gia, Loai } = req.body;

//     if (!MaMon || !TenMon || !Gia || !Loai) {
//         return res.render('admin/pages/addDish', {
//             layout: 'admin_layouts/mainAdmin',
//             title: 'Add Dish',
//             errorMessage: 'All fields are required.',
//         });
//     }

//     try {
//         const pool = await poolPromise;
//         await pool.request()
//             .input('MaMon', sql.Char(5), MaMon)
//             .input('TenMon', sql.NVarChar(50), TenMon)
//             .input('Gia', sql.Int, Gia)
//             .input('Loai', sql.NVarChar(50), Loai)
//             .query('INSERT INTO mon_an (MaMon, TenMon, Gia, Loai) VALUES (@MaMon, @TenMon, @Gia, @Loai)');

//         res.redirect('/admin/menu');
//     } catch (error) {
//         console.error('Error adding dish:', error);
//         res.status(500).send('Error adding dish');
//     }
// };

// Thêm món ăn
module.exports.addDish = async (req, res) => {
    const { MaMon, TenMon, Gia, Loai } = req.body;

    // Kiểm tra các trường nhập liệu
    if (!MaMon || !TenMon || !Gia || !Loai) {
        return res.render('admin/pages/addDish', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Add Dish',
            errorMessage: 'All fields are required.',
        });
    }

    try {
        const pool = await poolPromise;

        // Gọi procedure them_mon_an
        await pool.request()
            .input('MaMon', sql.Char(5), MaMon)
            .input('TenMon', sql.NVarChar(50), TenMon)
            .input('Gia', sql.Int, Gia)
            .input('Loai', sql.NVarChar(50), Loai)
            .execute('them_mon_an'); // Sử dụng procedure

        // Sau khi thêm thành công, chuyển hướng về trang menu
        res.redirect('/admin/menu');
    } catch (error) {
        console.error('Error adding dish:', error);

        // Render lại trang thêm món ăn với thông báo lỗi
        res.render('admin/pages/addDish', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Add Dish',
            errorMessage: 'An error occurred while adding the dish. Please try again.',
        });
    }
};


// Hiển thị form sửa món ăn
module.exports.renderEditDishForm = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaMon', sql.Char(5), id)
            .query('SELECT * FROM mon_an WHERE MaMon = @MaMon');

        if (result.recordset.length === 0) {
            return res.status(404).send('Dish not found');
        }

        res.render('admin/pages/editDish', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Edit Dish',
            dish: result.recordset[0],
        });
    } catch (error) {
        console.error('Error fetching dish:', error);
        res.status(500).send('Error fetching dish');
    }
};

// Sửa món ăn
module.exports.editDish = async (req, res) => {
    const { id } = req.params;
    const { TenMon, Gia, Loai } = req.body;

    if (!TenMon || !Gia || !Loai) {
        return res.render('admin/pages/editDish', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Edit Dish',
            errorMessage: 'All fields are required.',
            dish: { MaMon: id, TenMon, Gia, Loai },
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('MaMon', sql.Char(5), id)
            .input('TenMon', sql.NVarChar(50), TenMon)
            .input('Gia', sql.Int, Gia)
            .input('Loai', sql.NVarChar(50), Loai)
            .query('UPDATE mon_an SET TenMon = @TenMon, Gia = @Gia, Loai = @Loai WHERE MaMon = @MaMon');

        res.redirect('/admin/menu');
    } catch (error) {
        console.error('Error updating dish:', error);
        res.status(500).send('Error updating dish');
    }
};

// Xoá món ăn
module.exports.deleteDish = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('MaMon', sql.Char(5), id)
            .query('DELETE FROM mon_an WHERE MaMon = @MaMon');

        res.redirect('/admin/menu');
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).send('Error deleting dish');
    }
};

// Tìm kiếm món ăn
module.exports.searchDish = async (req, res) => {
    const { searchBy, searchInput } = req.query;

    if (!searchBy || !searchInput) {
        return res.render('admin/pages/menu', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Menu Management',
            errorMessage: 'Please provide a search criteria and keyword.',
        });
    }

    try {
        const pool = await poolPromise;
        let result;

        if (searchBy === 'maMon') {
            // Tìm kiếm theo mã món
            result = await pool.request()
                .input('ma_mon', sql.Char(5), searchInput)
                .execute('tim_mon_an_ma_mon');
        } else if (searchBy === 'tenMon') {
            // Tìm kiếm theo tên món
            result = await pool.request()
                .input('input_str', sql.NVarChar(50), searchInput)
                .execute('tim_mon_an_ten_mon');
        } else {
            throw new Error('Invalid search criteria');
        }

        res.render('admin/pages/menu', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Menu Management',
            dishes: result.recordset, // Hiển thị kết quả tìm kiếm
        });
    } catch (error) {
       // console.error('Error searching dish:', error);
    
        // Thay đổi từ việc trả về lỗi server thành cảnh báo không tìm thấy dữ liệu
        res.status(404).render('admin/pages/menu', {
            layout: 'admin_layouts/mainAdmin',
            title: 'Dish Search',
            errorMessage: 'No dishes found matching the search criteria.',
            dishes: [], // Trả về danh sách rỗng
            searchTerm: req.body.searchTerm // Để giữ trạng thái tìm kiếm
        });
    }
    
};
