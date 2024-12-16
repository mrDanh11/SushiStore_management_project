const express = require("express");
const route = express.Router();
// const employeeController = require("../../controllers/admin/employee.controller");
const reportController = require("../../controllers/admin/report.controller");  // Import controller

// Routes cho món bán chậm nhất
route.get('/food/slowest-branch', reportController.getSlowestDishByBranch);
route.get('/food/slowest-region', reportController.getSlowestDishByRegion);
route.get('/food/slowest-branch-date', reportController.getSlowestDishByBranchAndDate);

module.exports = route;