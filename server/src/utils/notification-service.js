const { query } = require("./database");
const { sendEmail } = require("./mailer");

const APP_URL = process.env.APP_URL || "https://social-nestt.vercel.app/";

/**
 * Centralized Notification Handler
 * - Saves to DB
 * - Sends Socket Event
 * - Sends Email (if enabled by user)
 */
async function sendNotification({ req, recipientId, type, postId = null }) {
  try {
    const sender = req.user;
    const senderId = sender.id;

    // 1. Sanity Check: Don't notify self
    if (Number(senderId) === Number(recipientId)) return;

    // 2. Fetch Recipient Info (Email & Settings)
    const userResult = await query(
      "SELECT id, username, email, full_name, notifications_enabled FROM users WHERE id = $1",
      [recipientId]
    );
    const recipient = userResult.rows[0];
    if (!recipient) return;

    // 3. Save to Database (History)
    await query(
      `INSERT INTO notifications (recipient_id, sender_id, type, post_id)
       VALUES ($1, $2, $3, $4)`,
      [recipientId, senderId, type, postId]
    );

    // 4. Send Real-Time Socket (Bell Icon)
    const socketId = global.userSocketMap?.get(String(recipientId));
    if (socketId) {
      req.io.to(socketId).emit("notification", {
        type,
        senderName: sender.username,
        senderAvatar: sender.profile_pic_url,
        senderId: senderId, 
        postId,
        message: `${sender.username} ${getActionText(type)}`
      });
    }

    // 5. Send Email (ONLY if user enabled it in Settings)
    if (recipient.notifications_enabled) {
      console.log(`[MAIL] Sending ${type} email to ${recipient.email}`);
      
      const subject = `New Activity: ${sender.full_name} ${getActionText(type)}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${recipient.full_name},</h2>
          <p><strong>@${sender.username}</strong> ${getActionText(type)}</p>
          <br/>
          <a href="${APP_URL}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Open App
          </a>
        </div>
      `;

      // "Fire and forget" - don't await, so the app stays fast
      sendEmail(recipient.email, subject, html).catch(err => 
        console.error("[MAIL ERROR]", err)
      );
    }

  } catch (error) {
    console.error("Notification Service Error:", error);
  }
}

function getActionText(type) {
  switch (type) {
    case "LIKE": return "liked your post.";
    case "COMMENT": return "commented on your post.";
    case "FOLLOW": return "started following you.";
    default: return "interacted with you.";
  }
}

module.exports = { sendNotification };
