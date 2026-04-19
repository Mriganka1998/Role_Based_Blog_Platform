const express = require("express");
const router = express.Router();

const { handleAuthOperations } = require("../controllers/AuthController");
const { handleBlogOperations } = require("../controllers/BlogController");
const { handleCategoryOperations } = require("../controllers/CategoryController");
const { verifySecretAndToken } = require("../middleware/auth");
const upload = require("../utils/blogImageUpload");

// Single Endpoints mapped through router.all as per requirement
router.all("/api/v1/auth", handleAuthOperations);
router.all("/api/v1/categories", verifySecretAndToken, handleCategoryOperations);
router.all("/api/v1/blogs", verifySecretAndToken, upload.single("image"), handleBlogOperations);

module.exports = router;
