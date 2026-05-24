const {
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  getFeedPosts,
  getGlobalFeed,
  getMixedFeed,
  updatePost: updatePostModel,
  searchPosts: searchPostsModel,  
} = require("../models/post.js");
const logger = require("../utils/logger");

/**
 * Create a new post
 */
const create = async (req, res) => {
  try {
    // 1. Get text data from validation
    const { content, comments_enabled } = req.validatedData;
    
    // 2. Determine media_url
    // If a file was uploaded, req.file.path is the Cloudinary secure URL
    // If no file, check if a URL string was passed in the body
    let media_url = req.file ? req.file.path : req.validatedData.media_url;

    const userId = req.user.id;

    const post = await createPost({
      user_id: userId,
      content,
      media_url,
      comments_enabled,
    });

    logger.verbose(`User ${userId} created post ${post.id}`);

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    logger.critical("Create post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get a single post by ID
 */

const getById = async (req, res) => {
  try {
    const id = Number(req.params.post_id);

    // Validate param
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "post_id must be a valid number" });
    }

    const post = await getPostById(id);

    // Either not found or soft-deleted
    if (!post || post.is_deleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json({ post });
  } catch (error) {
    logger.critical("Get post error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get posts by a specific user
 */
/**
 * Get posts by a specific user
 */
const getUserPosts = async (req, res) => {
  try {
    const userIdNum = Number(req.params.user_id);
    
    if (!Number.isInteger(userIdNum)) {
      return res.status(400).json({ error: "user_id must be a valid number" });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // FIX IS HERE: Changed 'user_id' to 'userIdNum'
    const posts = await getPostsByUserId(userIdNum, limit, offset, req.user?.id);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    logger.critical("Get user posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Get current user's posts
 */
const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const posts = await getPostsByUserId(userId, limit, offset, userId);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    logger.critical("Get my posts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete a post
 */
const remove = async (req, res) => {
  try {
    const { post_id } = req.params;
    const userId = req.user.id;

    const success = await deletePost(parseInt(post_id), userId);

    if (!success) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    logger.verbose(`User ${userId} deleted post ${post_id}`);

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    logger.critical("Delete post error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// TODO: Implement getFeed controller for content feed functionality
// server/src/controllers/posts.js

const getFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const posts = userId
      ? await getMixedFeed(userId, limit, offset)
      : await getGlobalFeed(limit, offset, 0);

    res.json({ 
      posts, 
      feedType: userId ? "mixed" : "public"
    });

  } catch (error) {
    logger.critical("Get feed error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// TODO: Implement updatePost controller for editing posts
const updatePost = async (req, res) => {
  try {
    const id = Number(req.params.post_id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "post_id must be a valid number" });
    }

    const { content, media_url, comments_enabled } = req.body ?? {};
    if (
      content !== undefined &&
      (typeof content !== "string" || !content.trim())
    ) {
      return res
        .status(400)
        .json({ error: "content must be a non-empty string" });
    }
    if (
      media_url !== undefined &&
      media_url !== null &&
      typeof media_url !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "media_url must be a string or null" });
    }
    if (
      comments_enabled !== undefined &&
      typeof comments_enabled !== "boolean"
    ) {
      return res
        .status(400)
        .json({ error: "comments_enabled must be a boolean" });
    }
    if (
      content === undefined &&
      media_url === undefined &&
      comments_enabled === undefined
    ) {
      return res
        .status(400)
        .json({ error: "Provide at least one field to update" });
    }

    const updated = await updatePostModel(id, req.user.id, {
      content: typeof content === "string" ? content.trim() : undefined,
      media_url: media_url === undefined ? undefined : media_url,
      comments_enabled,
    });

    if (!updated) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }
    return res.json({ message: "Post updated successfully", post: updated });
  } catch (error) {
    logger.critical("Update post error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// TODO: Implement searchPosts controller for searching posts by content
const searchPosts = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.status(400).json({ error: "q is required" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );
    const offset = (page - 1) * limit;

    const posts = await searchPostsModel(q, limit, offset);
    return res.json({ q, page, limit, count: posts.length, posts });
  } catch (error) {
    logger.critical("Search posts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  create,
  getById,
  getUserPosts,
  getMyPosts,
  remove,
  getFeed,
  updatePost,
  searchPosts,
};
