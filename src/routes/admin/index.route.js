const dashboardRoutes = require("./dashboard.route");
const branchesRoute = require("./branches.route");
const employeeRoute = require("./employee.route");

module.exports = (app) => {

    app.use('/admin/dashboard',dashboardRoutes)

    app.use('/admin/branches', branchesRoute)

    app.use('/admin/employees', employeeRoute)    
}