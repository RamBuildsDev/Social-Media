const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { removeFollower } = require("../controllers/users"); 
const { getUserById } = require("../controllers/users"); 
const upload = require("../middleware/upload"); // Reuse the S3 upload middleware
const { uploadProfilePic } = require("../controllers/users");
const { changePassword } = require("../controllers/users");
const {
  search,
  follow,
  unfollow,
  getMyFollowing,
  getMyFollowers,
  getMyStats,
  updateUserProfile,
} = require("../controllers/users");


const router = express.Router();

/**
 * User-related routes
 * TODO: Implement user routes when follow functionality is added
 */

// TODO: POST /api/users/search - Search a user
router.get("/search", optionalAuth, search);

// TODO: POST /api/users/follow - Follow a user
router.post("/follow", authenticateToken, follow);

// TODO: DELETE /api/users/unfollow - Unfollow a user
router.delete("/unfollow", authenticateToken, unfollow);

// TODO: GET /api/users/following - Get users that current user follows
router.get("/following", authenticateToken, getMyFollowing);

// TODO: GET /api/users/followers - Get users that follow current user
router.get("/followers", authenticateToken, getMyFollowers);

// TODO: GET /api/users/stats - Get follow stats for current user
router.get("/stats", authenticateToken, getMyStats);

// TODO: POST /api/users/search - Find users by name
router.put("/profile", authenticateToken, updateUserProfile);
router.put("/password", authenticateToken, changePassword);


// Add this new route:
router.delete("/followers/:user_id(\\d+)", authenticateToken, removeFollower);


// Add this route
router.get("/:id(\\d+)/profile", optionalAuth, getUserById);

router.put(
  "/profile-pic", 
  authenticateToken, 
  upload.single("avatar"), // Expect field name 'avatar'
  uploadProfilePic
);


module.exports = router;
