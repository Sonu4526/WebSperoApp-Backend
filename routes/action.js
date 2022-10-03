const express = require("express");
const router = express.Router();
const { getUserData, updateuser, getUserList, findNearestUser } = require("../controllers/action");
const { authorization } = require("../controllers/auth");

router.post("/find-nearest-users", authorization, findNearestUser);
router.get("/get/user/:id", getUserData)
router.post("/update/user/:id", authorization, updateuser)
router.get("/get/userlist", getUserList)

module.exports = router;