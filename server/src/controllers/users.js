const { query } = require("../utils/database");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs"); // Required for password change
const { sendNotification } = require("../utils/notification-service"); // Import Service
const {
  findUsersByName,
  getUserProfile,
  getPublicProfile: getPublicProfileModel,
  updateProfilePic: updateProfilePicModel,
  updateUserProfile: updateUserProfileModel,
  updateUserPassword
} = require("../models/user");

// Follow
async function follow(req, res) {
  try {
    const { user_id } = req.body || {};
    const me = req.user?.id;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    if (user_id === me) return res.status(400).json({ error: "Cannot follow yourself" });

    await query(
      `INSERT INTO follows (follower_id, followee_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [me, user_id]
    );

    // TRIGGER NOTIFICATION
    await sendNotification({
        req,
        recipientId: user_id,
        type: "FOLLOW"
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    logger.critical("Follow error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Unfollow
async function unfollow(req, res) {
  try {
    const { user_id } = req.body || {};
    const me = req.user?.id;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const r = await query(
      `DELETE FROM follows WHERE follower_id=$1 AND followee_id=$2`,
      [me, user_id]
    );
    return res.json({ ok: r.rowCount > 0 });
  } catch (err) {
    logger.critical("Unfollow error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get Following
async function getMyFollowing(req, res) {
  try {
    const me = req.user.id;
    const r = await query(
      `SELECT u.id, u.username, u.full_name
         FROM follows f
         JOIN users u ON u.id = f.followee_id
        WHERE f.follower_id = $1
        ORDER BY u.username`,
      [me]
    );
    return res.json({ count: r.rowCount, users: r.rows });
  } catch (err) {
    logger.critical("Get following error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get Followers
async function getMyFollowers(req, res) {
  try {
    const me = req.user.id;
    const r = await query(
      `SELECT u.id, u.username, u.full_name
         FROM follows f
         JOIN users u ON u.id = f.follower_id
        WHERE f.followee_id = $1
        ORDER BY u.username`,
      [me]
    );
    return res.json({ count: r.rowCount, users: r.rows });
  } catch (err) {
    logger.critical("Get followers error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Stats
async function getMyStats(req, res) {
  try {
    const counts = await getUserProfile(req.user.id);
    return res.json(counts);
  } catch (err) {
    logger.critical("Get stats error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Search
async function search(req, res) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "q is required" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const offset = (page - 1) * limit;

    const users = await findUsersByName(q, limit, offset, req.user?.id || 0);
    return res.json({ q, page, limit, count: users.length, users });
  } catch (err) {
    console.error("User search error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Update Profile
async function updateUserProfile(req, res) {
  try {
    const { full_name, username, email, notifications_enabled } = req.body ?? {};

    // Validation
    if (full_name !== undefined && (typeof full_name !== "string" || !full_name.trim()))
      return res.status(400).json({ error: "full_name invalid" });
    if (username !== undefined && (typeof username !== "string" || !/^[a-zA-Z0-9_]{3,30}$/.test(username)))
      return res.status(400).json({ error: "username invalid" });
    if (email !== undefined && (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
      return res.status(400).json({ error: "email invalid" });

    const updated = await updateUserProfileModel(req.user.id, {
      full_name, username, email, notifications_enabled
    });

    if (!updated) return res.status(404).json({ error: "User not found" });
    return res.json({ message: "Profile updated successfully", user: updated });
  } catch (err) {
    if (err._isUniqueViolation) return res.status(409).json({ error: "Username or email taken" });
    logger.critical("Update profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Remove Follower
async function removeFollower(req, res) {
  try {
    const followerId = Number(req.params.user_id);
    const me = req.user.id;
    await query(`DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, [followerId, me]);
    return res.json({ message: "Follower removed" });
  } catch (err) {
    console.error("Remove follower error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get User By ID (Public Profile)
async function getUserById(req, res) {
  try {
    const targetId = Number(req.params.id);
    const myId = req.user?.id || 0;
    if (!Number.isInteger(targetId)) return res.status(400).json({ error: "Invalid ID" });

    const user = await getPublicProfileModel(targetId, myId);
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error("Get user profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Upload Profile Pic
async function uploadProfilePic(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = req.file.path; // Cloudinary secure URL
    const user = await updateProfilePicModel(req.user.id, url);
    res.json({ message: "Profile picture updated", user });
  } catch (error) {
    console.error("Profile upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Change Password
async function changePassword(req, res) {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    if (!old_password || !new_password) return res.status(400).json({ error: "Both passwords required" });
    if (new_password.length < 6) return res.status(400).json({ error: "Password too short" });

    // Verify Old Password
    const userResult = await query("SELECT password_hash FROM users WHERE id=$1", [userId]);
    const currentHash = userResult.rows[0].password_hash;
    
    const isValid = await bcrypt.compare(old_password, currentHash);
    if (!isValid) return res.status(401).json({ error: "Incorrect old password" });

    // Update
    const newHash = await bcrypt.hash(new_password, 10);
    await updateUserPassword(userId, newHash);

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  search,
  follow,
  unfollow,
  getMyFollowing,
  getMyFollowers,
  getMyStats,
  updateUserProfile,
  removeFollower,
  getUserById,
  uploadProfilePic,
  changePassword
};
