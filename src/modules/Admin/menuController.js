const sql = require('mssql');
const { poolPromise } = require('../../config/db');

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

        res.render('AdminPage/menu', {
            layout: 'Admin/AdminMain',
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
    res.render('AdminPage/addDish', {
        layout: 'Admin/AdminMain',
        title: 'Menu Management',
    });
}

// Thêm món ăn
module.exports.addDish = async (req, res) => {
    const { MaMon, TenMon, Gia, Loai } = req.body;

    if (!MaMon || !TenMon || !Gia || !Loai) {
        return res.render('AdminPage/addDish', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish',
            errorMessage: 'All fields are required.',
        });
    }

    try {
        const pool = await poolPromise;

        // Gọi procedure them_mon_an
        await pool.request()
            .input('MaMon', sql.Char(6), MaMon)
            .input('TenMon', sql.NVarChar(50), TenMon)
            .input('Gia', sql.Int, Gia)
            .input('Loai', sql.NVarChar(50), Loai)
            .execute('them_mon_an'); 

        res.redirect('/admin/menu');
    } catch (error) {
        console.error('Error adding dish:', error);

        res.render('AdminPage/addDish', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish',
            errorMessage: 'An error occurred while adding the dish. Please try again.',
        });
    }
};

// form thêm món ăn chi nhánh
module.exports.renderAddDishToBranchesForm = async(req, res)=>{
    res.render('AdminPage/addDishToBranch', {
        layout: 'Admin/AdminMain',
        title: 'Menu Management',
    });
}

// Thêm món ăn vào chi nhánh
module.exports.addDishToBranch = async (req, res) => {
    const { MaCN, MaMon, GiaoHang } = req.body;

    if (!MaCN || !MaMon || GiaoHang === undefined) {
        return res.render('AdminPage/addDishToBranch', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish to Branch',
            errorMessage: 'All fields are required.',
        });
    }

    try {
        const pool = await poolPromise;

        // Gọi procedure them_mon_an_chi_nhanh
        await pool.request()
            .input('MaCN', sql.Int, MaCN)
            .input('MaMon', sql.Char(6), MaMon)
            .input('GiaoHang', sql.Bit, GiaoHang)
            .execute('them_mon_an_chi_nhanh');

        res.redirect('/admin/menu'); 
    } catch (error) {
        console.error('Error adding dish to branch:', error);

        res.render('AdminPage/addDishToBranch', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish to Branch',
            errorMessage: 'An error occurred while adding the dish to the branch. Please try again.',
        });
    }
};

// form thêm món ăn khu vực
module.exports.renderAddDishToRegionForm = async(req, res)=>{
    res.render('AdminPage/addDishToRegion', {
        layout: 'Admin/AdminMain',
        title: 'Menu Management',
    });
}
// thêm món ăn khu vực
module.exports.addDishToRegion = async (req, res) => {
    const { MaMon, MaKV } = req.body;

    if (!MaMon || !MaKV) {
        return res.render('AdminPage/addDishToRegion', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish to Region',
            errorMessage: 'All fields are required.',
        });
    }

    try {
        const pool = await poolPromise;

        // Gọi procedure them_mon_an_khu_vuc
        await pool.request()
            .input('MaMon', sql.Char(6), MaMon)
            .input('MaKV', sql.Int, MaKV)
            .execute('them_mon_an_khu_vuc');

        res.redirect('/admin/menu'); 
    } catch (error) {
        console.error('Error adding dish to region:', error);

        res.render('AdminPage/addDishToRegion', {
            layout: 'Admin/AdminMain',
            title: 'Add Dish to Region',
            errorMessage: 'An error occurred while adding the dish to the region. Please try again.',
        });
    }
};


// Hiển thị form sửa món ăn
module.exports.renderEditDishForm = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('MaMon', sql.Char(6), id)
            .query('SELECT * FROM mon_an WHERE MaMon = @MaMon');

        if (result.recordset.length === 0) {
            return res.status(404).send('Dish not found');
        }

        res.render('AdminPage/editDish', {
            layout: 'Admin/AdminMain',
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
        return res.render('AdminPage/editDish', {
            layout: 'Admin/AdminMain',
            title: 'Edit Dish',
            errorMessage: 'All fields are required.',
            dish: { MaMon: id, TenMon, Gia, Loai },
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('MaMon', sql.Char(6), id)
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

// // Xoá món ăn
// module.exports.deleteDish = async (req, res) => {
//     try {
//         const { id } = req.params; 
//         const { regionId, branchId } = req.query; 
//         console.log(req.params);
//         if (!id) {
//             return res.status(400).send('Dish ID is required');
//         }

//         const pool = await poolPromise;

//         if (!regionId && !branchId) {
//             await pool.request()
//                 .input('MaMon', sql.Char(6), id)
//                 .execute('xoa_mon_an');
//         }

//         else if (branchId) {
//             await pool.request()
//                 .input('MaCN', sql.Int, branchId)
//                 .input('MaMon', sql.Char(6), id)
//                 .execute('xoa_mon_an_chi_nhanh');
//         }

//         else if (regionId) {
//             await pool.request()
//                 .input('MaKV', sql.Int, regionId)
//                 .input('MaMon', sql.Char(6), id)
//                 .execute('xoa_mon_an_khu_vuc');
//         }

//         res.redirect('/admin/menu');
//     } catch (error) {
//         console.error('Error deleting dish:', error);
//         res.status(500).send('Error deleting dish');
//     }
// };

// Xoá món ăn
module.exports.deleteDish = async (req, res) => {
    try {
        const { id } = req.params; // Lấy mã món ăn
        const { regionId, branchId } = req.body; // Lấy khu vực hoặc chi nhánh từ body của form

        console.log("regionID:", regionId);
        console.log("branchId:", branchId);

        if (!id) {
            return res.status(400).send('Dish ID is required');
        }

        const pool = await poolPromise;

        // Nếu không có `regionId` hoặc `branchId`, xoá món ăn khỏi toàn bộ hệ thống
        if (!regionId && !branchId) {
            await pool.request()
                .input('MaMon', sql.Char(6), id)
                .execute('xoa_mon_an'); // Xoá món khỏi toàn hệ thống
        }
        // Nếu có `branchId`, chỉ xoá món khỏi chi nhánh
        else if (branchId) {
            await pool.request()
                .input('MaCN', sql.Int, branchId)
                .input('MaMon', sql.Char(6), id)
                .execute('xoa_mon_an_chi_nhanh'); // Xoá món khỏi chi nhánh cụ thể
        }
        // Nếu có `regionId`, chỉ xoá món khỏi khu vực
        else if (regionId) {
            await pool.request()
                .input('MaKV', sql.Int, regionId)
                .input('MaMon', sql.Char(6), id)
                .execute('xoa_mon_an_khu_vuc'); // Xoá món khỏi khu vực cụ thể
        }

        // Chuyển hướng lại trang menu
        res.redirect(req.headers.referer || '/admin/menu'); // Giữ lại trạng thái route hiện tại
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).send('Error deleting dish');
    }
};




// Tìm kiếm món ăn
module.exports.searchDish = async (req, res) => {
    const { searchBy, searchInput } = req.query;

    if (!searchBy || !searchInput) {
        return res.render('AdminPage/menu', {
            layout: 'Admin/AdminMain',
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
                .input('ma_mon', sql.Char(6), searchInput)
                .execute('tim_mon_an_ma_mon');
        } else if (searchBy === 'tenMon') {
            // Tìm kiếm theo tên món
            result = await pool.request()
                .input('input_str', sql.NVarChar(50), searchInput)
                .execute('tim_mon_an_ten_mon');
        } else {
            throw new Error('Invalid search criteria');
        }

        res.render('AdminPage/menu', {
            layout: 'Admin/AdminMain',
            title: 'Menu Management',
            dishes: result.recordset, 
        });
    } catch (error) {
       // console.error('Error searching dish:', error);
    
        // Thay đổi từ việc trả về lỗi server thành cảnh báo không tìm thấy dữ liệu
        res.status(404).render('AdminPage/menu', {
            layout: 'Admin/AdminMain',
            title: 'Dish Search',
            errorMessage: 'No dishes found matching the search criteria.',
            dishes: [], 
            searchTerm: req.body.searchTerm 
        });
    }
    
};


// NOTE
// chưa có trường hợp vừa chọn được khu vực, vừa chọn được chi nhánh
// chỉ có chi nhánh riêng, khu vực riêng
// xoá ở route admin/menu nó chưa xoá được