const express = require("express");
const { validateRequest, createPostSchema } = require("../utils/validation");
const {
  create,
  getById,
  getUserPosts,
  getMyPosts,
  remove,
  getFeed,
  updatePost,
  searchPosts,
} = require("../controllers/posts");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload"); // Import the upload middleware

const router = express.Router();

router.get("/feed", optionalAuth, getFeed);
router.get("/my", authenticateToken, getMyPosts);
router.get("/user/:user_id(\\d+)", optionalAuth, getUserPosts);
router.get("/search", optionalAuth, searchPosts);

router.get("/:post_id(\\d+)", optionalAuth, getById);
router.put("/:post_id(\\d+)", authenticateToken, updatePost);
router.delete("/:post_id(\\d+)", authenticateToken, remove);

// UPDATED: Add 'upload.single("media")' before validation
// This processes the file upload to S3 BEFORE we validate the text content
router.post(
  "/", 
  authenticateToken, 
  upload.single("media"), 
  validateRequest(createPostSchema), 
  create
);

module.exports = router;
