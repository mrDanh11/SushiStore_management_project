const express = require('express');
const route = express.Router();
const userController = require("../../controllers/admin/user.controller");

// Route hiển thị users và thẻ
route.get('/', userController.getUsers);

// Route thêm thẻ
route.post('/cards/add', userController.addCard);

// Route xóa thẻ
route.post('/cards/delete/:MaThe', userController.deleteCard);

// Route sửa thẻ
route.post('/cards/edit/:MaThe', userController.editCard);

// Route xử lý tìm kiếm người dùng
route.get('/search', userController.searchUsers);

module.exports = route;
