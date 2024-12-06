const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const app = express();
const sql = require('mssql')
const PORT = process.env.PORT || 3000;

const Handlebars = require('handlebars');

// Đăng ký helper limit
Handlebars.registerHelper('limit', function(array, limit) {
    return array.slice(0, limit);
});

// Cấu hình session
app.use(session({
    secret: 'your_secret_key',  // Chìa khóa bí mật để mã hóa session
    resave: false,              // Không lưu lại session nếu không có thay đổi
    saveUninitialized: true,    // Lưu session mới ngay cả khi chưa có giá trị
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Thời gian sống của cookie (1 ngày)
    }
}));

const viewsRoutes = require('./src/routes/viewsRoutes'); // Điều hướng view
const adminRoute = require("./src/routes/admin/index.route");


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Handlebars
app.engine('hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main', // Layout chính
    partialsDir: path.join(__dirname, 'src', 'views', 'partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src', 'views'))

app.use(express.static(path.join(__dirname, 'src', 'public')));

app.use('/', viewsRoutes);

// route admin
adminRoute(app);

const {sqlConfig, poolPromise} = require("./src/config/database");


// Kết nối đến SQL Server và thực hiện truy vấn
async function queryData() {
  try {
    await sql.connect(sqlConfig);

    // Truy vấn dữ liệu từ bảng "khach_hang" (hoặc bất kỳ bảng nào trong cơ sở dữ liệu của bạn)
    const result = await sql.query('SELECT * FROM khach_hang');

    // Hiển thị kết quả truy vấn
    console.log(result.recordset); // recordset chứa dữ liệu trả về

  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    // Đóng kết nối
    await sql.close();
  }
}

queryData();

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
