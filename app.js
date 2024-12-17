const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const path = require('path');
const app = express();
const sql = require('mssql');
const PORT = process.env.PORT || 3000;

// const { sqlConfig, poolPromise } = require("./src/config/database");

// Đăng ký helper formatTime
const hbsInstance = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main', 
  partialsDir: path.join(__dirname, 'src', 'views', 'partials'),
  helpers: {
    formatTime: (time) => {
      if (!time) return 'N/A';

      const date = new Date(time);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    },
    limit: function (array, limit) {
      return array.slice(0, limit);
    },
    // Helper eq để so sánh hai giá trị
    eq: function (a, b, options) {
      if (a === b) {
        return options.fn(this); // Nếu bằng nhau thì render phần trong {{#eq}}
      } else {
        return options.inverse ? options.inverse(this) : ''; // Nếu không bằng thì render phần trong {{else}}, nếu có
      }
    },
    // Helper để so sánh hai giá trị
    ifCond: function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this); // Nếu v1 == v2, render nội dung bên trong {{#ifCond}}
      } else {
        return options.inverse(this); // Nếu v1 != v2, render phần {{else}}, nếu có
      }
    },
    isEqual: function (a, b) {
      return a === b; 
    }

  }
});

// Cấu hình Handlebars trong Express
app.engine('hbs', hbsInstance.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src', 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cấu hình session
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Đăng ký routes
const viewsRoutes = require('./src/routes/viewsRoutes');
const adminRoute = require("./src/routes/admin/index.route");

app.use(express.static(path.join(__dirname, 'src', 'public')));

app.use('/', viewsRoutes);
adminRoute(app);


// Lắng nghe server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
