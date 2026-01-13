const { User, Notification } = require('../model/index');
const { transporter, buildBaseEmail } = require('./mailer');
const { sendFirstBlood, sendNewChallenge } = require('./discord');

const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Netanix Portal';

class NotificationService {
  // Create notification for a specific user
  static async createNotification(userId, type, title, message, data = null, isGlobal = false) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        isGlobal
      });
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create global notifications
  static async createGlobalNotification(type, title, message, data = null, excludeUserId = null) {
    try {
      const users = await User.findAll({
        where: excludeUserId ? { id: { [require('sequelize').Op.ne]: excludeUserId } } : {},
        attributes: ['id']
      });

      const notifications = users.map(user => ({
        userId: user.id,
        type,
        title,
        message,
        data,
        isGlobal: true
      }));

      await Notification.bulkCreate(notifications);
      return notifications.length;
    } catch (error) {
      console.error('Error creating global notifications:', error);
      throw error;
    }
  }

  // ================= FIRST BLOOD =================
  static async notifyFirstBlood(challengeTitle, solverUsername, challengeId, solverId) {
    try {
      console.log('');
      console.log('🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸');
      console.log('🩸 FIRST BLOOD FUNCTION CALLED!');
      console.log('🩸 Parameters received:');
      console.log('🩸   challengeTitle:', challengeTitle);
      console.log('🩸   solverUsername:', solverUsername);
      console.log('🩸   challengeId:', challengeId);
      console.log('🩸   solverId:', solverId);
      console.log('🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸🩸');
      console.log('');
      
      const title = '🩸 First Blood!';
      const message = `${solverUsername} just got the first blood on "${challengeTitle}"!`;
      const data = { challengeId, solverId, challengeTitle, solverUsername };

      // Create in-app notifications
      await this.createGlobalNotification('first_blood', title, message, data, solverId);
      console.log('✅ In-app notifications created');

      // Send Discord notification
      try {
        await sendFirstBlood(solverUsername, challengeTitle);
        console.log('✅ Discord notification sent');
      } catch (discordError) {
        console.error('❌ Discord error:', discordError.message);
      }

      // Send emails
      await this.emailFirstBlood(challengeTitle, solverUsername, solverId);
      console.log('✅ Emails sent');

      console.log(`✅ First blood notification completed for: ${challengeTitle}`);
    } catch (error) {
      console.error('❌ Error sending first blood notification:', error);
      console.error('Stack:', error.stack);
    }
  }

  // ================= NEW CHALLENGE =================
  // ✅ Made category and difficulty OPTIONAL with default values
  static async notifyNewChallenge(challengeTitle, authorUsername, challengeId, authorId, category = 'General', difficulty = 'Medium') {
    try {
      console.log(`🎯 New Challenge triggered: ${challengeTitle} by ${authorUsername}`);
      
      // 📢 In-app & email: show author
      const title = '🎯 New Challenge Available!';
      const message = `A new challenge "${challengeTitle}" has been created by ${authorUsername}. Check it out!`;
      const data = { challengeId, authorId, challengeTitle, authorUsername, category, difficulty };

      // Create in-app notifications
      await this.createGlobalNotification('challenge_created', title, message, data, authorId);
      console.log('✅ In-app notifications created');

      // 🚫 Discord: NO author — only title, category, difficulty
      try {
        await sendNewChallenge(challengeTitle, category, difficulty);
        console.log('✅ Discord notification sent');
      } catch (discordError) {
        console.error('❌ Discord error:', discordError.message);
      }

      // Send emails
      await this.emailNewChallenge(challengeTitle, authorUsername, authorId);
      console.log('✅ Emails sent');

      console.log(`✅ New challenge notification completed: ${challengeTitle} [${category}/${difficulty}]`);
    } catch (error) {
      console.error('❌ Error sending new challenge notification:', error);
      console.error('Stack:', error.stack);
    }
  }

  // Login notification
  static async notifyLogin(userId, username, ipAddress) {
    try {
      const title = '🔐 Login Detected';
      const message = `Welcome back, ${username}! You have successfully logged in.`;
      const data = { ipAddress, loginTime: new Date() };

      await this.createNotification(userId, 'login', title, message, data);
      console.log(`Login notification created for user: ${username}`);
    } catch (error) {
      console.error('Error creating login notification:', error);
    }
  }

  // Email first blood
  static async emailFirstBlood(challengeTitle, solverUsername, excludeUserId) {
    try {
      const where = { isActive: true };
      if (excludeUserId) {
        where.id = { [require('sequelize').Op.ne]: excludeUserId };
      }
      const users = await User.findAll({
        where,
        attributes: ['email', 'username']
      });

      const html = buildBaseEmail({
        title: '🩸 First Blood Alert!',
        bodyHtml: `
          <p>Exciting news from the CTF arena!</p>
          <p><strong>${solverUsername}</strong> just achieved <span style="color:#ef4444;font-weight:bold">FIRST BLOOD</span> on the challenge:</p>
          <div style="background:#1f2937;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ef4444">
            <h4 style="margin:0;color:#f9fafb">${challengeTitle}</h4>
          </div>
          <p>Think you can solve it too? Head over to the platform and give it a try!</p>
          <p style="color:#10b981;font-weight:bold">The competition is heating up! 🔥</p>
        `
      });

      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const emailPromises = batch.map(user =>
          transporter.sendMail({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: user.email,
            subject: `🩸 First Blood: ${challengeTitle}`,
            html
          }).catch(err => console.error(`Failed to send first blood email to ${user.email}:`, err.message))
        );

        await Promise.allSettled(emailPromises);

        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`First blood emails sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending first blood emails:', error);
    }
  }

  // Email new challenge
  static async emailNewChallenge(challengeTitle, authorUsername, excludeUserId) {
    try {
      const where = { isActive: true };
      if (excludeUserId) {
        where.id = { [require('sequelize').Op.ne]: excludeUserId };
      }
      const users = await User.findAll({
        where,
        attributes: ['email', 'username']
      });

      const html = buildBaseEmail({
        title: '🎯 New Challenge Available!',
        bodyHtml: `
          <p>A fresh challenge awaits you!</p>
          <p><strong>${authorUsername}</strong> has just created a new challenge:</p>
          <div style="background:#1f2937;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #60a5fa">
            <h4 style="margin:0;color:#f9fafb">${challengeTitle}</h4>
          </div>
          <p>Ready to test your skills? Log in now and be among the first to solve it!</p>
          <p style="color:#60a5fa;font-weight:bold">May the best hacker win! 🏆</p>
        `
      });

      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const emailPromises = batch.map(user =>
          transporter.sendMail({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: user.email,
            subject: `🎯 New Challenge: ${challengeTitle}`,
            html
          }).catch(err => console.error(`Failed to send new challenge email to ${user.email}:`, err.message))
        );

        await Promise.allSettled(emailPromises);

        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`New challenge emails sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending new challenge emails:', error);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const notifications = await Notification.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const [updatedRows] = await Notification.update(
        { isRead: true },
        { where: { id: notificationId, userId } }
      );
      return updatedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      const [updatedRows] = await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } }
      );
      return updatedRows;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Count unread notifications
  static async getUnreadCount(userId) {
    try {
      const count = await Notification.count({
        where: { userId, isRead: false }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  // Cleanup old notifications
  static async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deletedCount = await Notification.destroy({
        where: {
          createdAt: { [require('sequelize').Op.lt]: thirtyDaysAgo }
        }
      });
      console.log(`Cleaned up ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
