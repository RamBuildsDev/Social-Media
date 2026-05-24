const { query } = require("../utils/database");


/**
 * Create a new post
 * @param {Object} postData 
 * @returns {Promise<Object>} 
 */
const createPost = async ({
  user_id,
  content,
  media_url,
  comments_enabled = true,
}) => {
  const result = await query(
    `INSERT INTO posts (user_id, content, media_url, comments_enabled, created_at, is_deleted)
     VALUES ($1, $2, $3, $4, NOW(), FALSE)
     RETURNING id, user_id, content, media_url, comments_enabled, created_at`,
    [user_id, content, media_url, comments_enabled],
  );

  return result.rows[0];
};

/**
 * Get post by ID
 * @param {number} postId 
 * @returns {Promise<Object|null>} 
 */
const getPostById = async (postId) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name, u.profile_pic_url
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1`,
    [postId],
  );

  return result.rows[0] || null;
};

/**
 * Get posts by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
// Inside src/models/post.js

const getPostsByUserId = async (userId, limit = 20, offset = 0, viewerId = null) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name, u.profile_pic_url,
        (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $4)) AS has_liked
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1
       AND p.is_deleted = FALSE  -- <--- THIS LINE WAS MISSING!
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset, viewerId || 0],
  );
  return result.rows;
};
/**
 * Delete a post
 * @param {number} postId - Post ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} Success status
 */
const deletePost = async (postId, userId) => {
  const result = await query(
    "UPDATE posts SET is_deleted = TRUE WHERE id = $1 AND user_id = $2",
    [postId, userId],
  );

  return result.rowCount > 0;
};




//TODO: Implement getFeedPosts function that returns posts from followed users
const getFeedPosts = async (userId, limit = 10, offset = 0) => {
  const result = await query(
    `SELECT
        p.*,
        u.username,
        u.full_name,
        u.profile_pic_url,
        (SELECT COUNT(*)::int FROM likes    l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)) AS has_liked
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_deleted = FALSE
       AND (
            p.user_id = $1
         OR p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = $1)
       )
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};
// TODO: Implement updatePost function for editing posts
async function updatePost(
  postId,
  userId,
  { content, media_url, comments_enabled }
) {
  const sets = [];
  const vals = [];

  if (typeof content === "string") {
    sets.push(`content = $${sets.length + 1}`);
    vals.push(content);
  }
  if (media_url !== undefined) {
    sets.push(`media_url = $${sets.length + 1}`);
    vals.push(media_url);
  }
  if (typeof comments_enabled === "boolean") {
    sets.push(`comments_enabled = $${sets.length + 1}`);
    vals.push(comments_enabled);
  }

  if (sets.length === 0) return null; 

  const idIdx = sets.length + 1;
  const userIdx = sets.length + 2;

  const sql = `
    UPDATE posts
       SET ${sets.join(", ")}, updated_at = NOW()
     WHERE id = $${idIdx}
       AND user_id = $${userIdx}
       AND is_deleted = FALSE
     RETURNING id, user_id, content, media_url, comments_enabled, created_at, updated_at
  `;

  vals.push(postId, userId);
  const r = await query(sql, vals);
  return r.rows[0] || null;
}

// TODO: Implement searchPosts function for content search
async function searchPosts(q, limit = 20, offset = 0) {
  const r = await query(
    `SELECT
        p.*,
        u.username,
        u.full_name,
        u.profile_pic_url,
        (SELECT COUNT(*)::int FROM likes    l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.is_deleted = FALSE
       AND (
            p.content ILIKE $1
         OR COALESCE(p.media_url,'') ILIKE $1
       )
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${q}%`, limit, offset]
  );
  return r.rows;
}
//Fetch global posts for suggestions
const getGlobalFeed = async (limit = 20, offset = 0, excludeUserId) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name, u.profile_pic_url,
        (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $3)) AS has_liked
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_deleted = FALSE 
       AND ($3 = 0 OR p.user_id != $3)
     ORDER BY p.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, excludeUserId]
  );
  return result.rows.map(post => ({ ...post, is_suggested: true }));
};
const getMixedFeed = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT 
       p.*, 
       u.username, 
       u.full_name, 
       u.profile_pic_url,
       (SELECT COUNT(*)::int FROM likes l WHERE l.post_id = p.id) AS like_count,
       (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
       (SELECT EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1)) AS has_liked,
       
       -- Check if the current user follows the post author
       (SELECT EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followee_id = p.user_id)) AS is_following

     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.is_deleted = FALSE 
       AND p.user_id != $1 -- Exclude my own posts
     
     ORDER BY 
       is_following DESC,  -- 1. SHOW FOLLOWED USERS FIRST
       p.created_at DESC   -- 2. Then show newest posts
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map(post => ({
    ...post,
    // Helper flag for the frontend: if I don't follow them, it's a suggestion
    is_suggested: !post.is_following 
  }));
};
module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  getFeedPosts,
  updatePost,
  searchPosts,
  getGlobalFeed,
  getMixedFeed,
};
