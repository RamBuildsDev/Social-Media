const { query } = require("../utils/database");
const bcrypt = require("bcryptjs");

/**
 * User model for database operations
 */

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async ({ cleanUsername, email, password, full_name }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (username, email, password_hash, full_name, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, username, email, full_name, created_at`,
    [cleanUsername, email, hashedPassword, full_name],
  );

  return result.rows[0];
};

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null
 */
const getUserByUsername = async (username) => {
  const result = await query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const getUserById = async (id) => {
  const result = await query(
    "SELECT id, username, email, full_name, created_at, profile_pic_url FROM users WHERE id = $1",
    [id],
  );

  return result.rows[0] || null;
};

/**
 * Verify user password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password match result
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};


// TODO: Implement findUsersByName function for search functionality
// This should support partial name matching and pagination
async function findUsersByName(search, limit = 20, offset = 0, excludeId = 0) {
  const like = `%${search}%`;
  const result = await query(
    `SELECT id, username, full_name
       FROM users
      WHERE is_deleted = FALSE
        AND (username ILIKE $1 OR full_name ILIKE $1)
        AND ($4 = 0 OR id != $4)
      ORDER BY username ASC
      LIMIT $2 OFFSET $3`,
    [like, limit, offset, excludeId]
  );
  return result.rows;
}



// TODO: Implement getUserProfile function that includes follower/following counts
// Inside src/models/user.js

async function getUserProfile(userId) {
  const r = await query(
    `SELECT
        username, full_name, profile_pic_url, 
        (SELECT COUNT(*)::int FROM follows WHERE followee_id = $1) AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = $1) AS following
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return r.rows[0];
}



// TODO: Implement updateUserProfile function for profile updates

async function updateUserProfile(userId, { full_name, username, email, notifications_enabled }) {
  const sets = [];
  const vals = [];

  if (typeof full_name === "string") { sets.push(`full_name = $${sets.length + 1}`); vals.push(full_name.trim()); }
  if (typeof username === "string") { sets.push(`username = $${sets.length + 1}`); vals.push(username.trim()); }
  if (typeof email === "string") { sets.push(`email = $${sets.length + 1}`); vals.push(email.trim()); }
  
  // NEW: Add notifications toggle
  if (typeof notifications_enabled === "boolean") { 
      sets.push(`notifications_enabled = $${sets.length + 1}`); 
      vals.push(notifications_enabled); 
  }

  if (sets.length === 0) return null;

  const sql = `
    UPDATE users
       SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${sets.length + 1}
       AND is_deleted = FALSE
     RETURNING id, username, email, full_name, profile_pic_url, notifications_enabled, created_at
  `;
  vals.push(userId);

  try {
    const r = await query(sql, vals);
    return r.rows[0] || null;
  } catch (err) {
    if (err && err.code === "23505") { err._isUniqueViolation = true; }
    throw err;
  }
}

//  Update Password directly
async function updateUserPassword(userId, hashedPassword) {
    const r = await query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [hashedPassword, userId]
    );
    return r.rowCount > 0;
}

//  Find user by email (for Forgot Password)
async function getUserByEmail(email) {
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
}


// Inside src/models/user.js

async function getPublicProfile(targetUserId, currentUserId) {
  const result = await query(
    `SELECT 
       u.id, u.username, u.full_name, u.created_at, u.profile_pic_url,
       (SELECT COUNT(*)::int FROM follows WHERE followee_id = u.id) AS followers,
       (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following,
       (SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $2 AND followee_id = u.id)) AS is_following
     FROM users u
     WHERE u.id = $1 AND u.is_deleted = FALSE`,
    [targetUserId, currentUserId]
  );
  return result.rows[0];
}

async function updateProfilePic(userId, url) {
  const result = await query(
    `UPDATE users 
     SET profile_pic_url = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING id, username, email, full_name, profile_pic_url`,
    [url, userId]
  );
  return result.rows[0];
}
module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  findUsersByName,
  getUserProfile,
  updateUserProfile,
  getPublicProfile,
  updateProfilePic,
  updateUserProfile,
  updateUserPassword,
  getUserByEmail,
};
