const express = require("express");
const route = express.Router();
const employeeController = require("../../controllers/admin/employee.controller");

// Hiển thị danh sách nhân viên
route.get('/', employeeController.getAllEmployees);

// Thêm nhân viên
route.get('/add', (req, res) => {
    res.render('admin/pages/addEmployee', {
        layout: 'admin_layouts/mainAdmin',
        title: 'Employee Management',
        scripts: '<script src="/js/employee.js"></script>',
    });
});
route.post('/add', employeeController.addEmployee); // Xử lý thêm nhân viên

// Sửa nhân viên
route.get('/edit/:id', employeeController.getEmployeeById); // Render form sửa nhân viên
route.post('/edit/:id', employeeController.editEmployee); // Xử lý sửa nhân viên

// Xóa nhân viên
route.post('/delete/:id', employeeController.deleteEmployee); // Xử lý xóa nhân viên

module.exports = route;
