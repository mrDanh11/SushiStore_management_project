const express = require("express");
const route = express.Router();
const branchesController = require("../../controllers/admin/branches.controller");
const branchController = require("../../controllers/admin/branches.controller");

// route.get('/', branchesController.getAllBranches);

// // Thêm chi nhánh
// route.get('/add', (req, res) => {
//     res.render('admin/pages/addBranches', {
//         layout: 'admin_layouts/mainAdmin',
//         title: 'Branches',
//         scripts: '<script src="/js/home.js"></script>',
//         //branches: result.recordset
//       });
// }); 
// route.post('/add', branchesController.addBranch); 

// // Sửa chi nhánh
// route.get('/edit/:id', branchesController.getBranchById); 
// route.post('/edit/:id', branchesController.editBranch); 

// // Xóa chi nhánh
// route.post('/delete/:id', branchesController.deleteBranch); 


//-------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------
route.get('/', branchController.getAllBranches);
route.get('/add', branchController.showAddBranchForm);
route.post('/add', branchController.addBranch);
route.get('/edit/:id', branchController.showEditBranchForm);
route.post('/edit/:id', branchController.editBranch);
route.post('/delete/:id', branchController.deleteBranch);


module.exports = route