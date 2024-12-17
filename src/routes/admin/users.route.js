const express = require('express');
const route = express.Router();
const userController = require("../../controllers/admin/user.controller");

// Route hiển thị users và thẻ
route.get('/', userController.getUsers);

// Route thêm thẻ
route.get('/add', userController.getFormAddUsers);
route.post('/add', userController.addCard);

// Route xóa thẻ
route.post('/delete/:MaThe', userController.deleteCard);

// Route sửa thẻ
route.get('/edit/:MaThe',userController.getEditCard);
route.post('/edit/:MaThe', userController.editCard);

// Route xử lý tìm kiếm người dùng
route.get('/search', userController.searchUsers);

module.exports = route;
