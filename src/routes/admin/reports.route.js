const express = require("express");
const route = express.Router();
// const employeeController = require("../../controllers/admin/employee.controller");
const reportController = require("../../controllers/admin/report.controller");  // Import controller

// Thêm route để lấy báo cáo doanh thu theo tháng và năm
route.get('/', reportController.getRevenueReport);

// Route để lấy báo cáo theo tháng
route.get('/monthly', reportController.getMonthlyReport);

// Route để lấy báo cáo theo quý
route.get('/quarterly', reportController.getQuarterlyReport);

// Route để lấy báo cáo theo năm
route.get('/yearly', reportController.getYearlyReport);

module.exports = route;