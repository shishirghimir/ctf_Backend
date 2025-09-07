const express = require("express");
const { createUser } = require("../Controller/praccontroller");

const router = express.Router();

router.post("/", createUser); // POST /api/model

module.exports = router;
