const axios = require("axios");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h  ",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c  "
};

/**
 * Sends Discord embed message
 */
async function sendDiscordEmbed(webhook, embed) {
  try {
    await axios.post(webhook, { embeds: [embed] });
    console.log("✅ Discord notification sent successfully");
    return true;
  } catch (err) {
    console.error("❌ Discord Error:", err.response?.data || err.message);
    return false;
  }
}

module.exports = {
  /**
   * 🔥 FIRST BLOOD — EPIC, BOLD, CLEAN + YOUR IMAGE
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🩸 **FIRST BLOOD CLAIMED!**`,
        description: `## 🏆 **${solverUsername}**\n\n> *Drew the first drop of blood on:*\n\n# 🎯 **${challengeTitle}**\n\n*The hunt begins — who's next?*`,
        color: 0xDC143C, // Crimson red
        fields: [
          { name: "⚔️ Achievement", value: "`FIRST BLOOD`", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true },
          { name: "🎯 Challenge", value: `\`${challengeTitle.length > 25 ? challengeTitle.substring(0, 25) + "..." : challengeTitle}\``, inline: true }
        ],
        thumbnail: {
          url: "https://i.imgur.com/OBiq3ap.png"
        },
        footer: {
          text: "🔥 NETANIX CTF • First Blood Event",
          icon_url: "https://i.imgur.com/5K8zXqW.png"
        },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.firstBlood, embed);
    } catch (err) {
      console.error("Error in sendFirstBlood:", err);
      return false;
    }
  },

  /**
   * 🥈 SECOND BLOOD — SILVER, CLEAN, CONSISTENT
   */
  async sendSecondBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🥈 **SECOND BLOOD CLAIMED!**`,
        description: `## 🎖️ **${solverUsername}**\n\n> *Hot on the trail of the first!*\n\n# 🎯 **${challengeTitle}**\n\n*The race is on!*`,
        color: 0xB0B0B0,
        fields: [
          { name: "⚔️ Achievement", value: "`SECOND BLOOD`", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true },
          { name: "🎯 Challenge", value: `\`${challengeTitle.length > 25 ? challengeTitle.substring(0, 25) + "..." : challengeTitle}\``, inline: true }
        ],
        thumbnail: {
          url: "https://i.imgur.com/5K8zXqW.png"
        },
        footer: {
          text: "🥈 NETANIX CTF • Second Blood",
          icon_url: "https://i.imgur.com/5K8zXqW.png"
        },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.firstBlood, embed);
    } catch (err) {
      console.error("Error in sendSecondBlood:", err);
      return false;
    }
  },

  /**
   * 🥉 THIRD BLOOD — BRONZE, CLEAN, CONSISTENT
   */
  async sendThirdBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🥉 **THIRD BLOOD CLAIMED!**`,
        description: `## 🏅 **${solverUsername}**\n\n> *Rounding out the podium!*\n\n# 🎯 **${challengeTitle}**\n\n*The legend grows!*`,
        color: 0xCD7F32,
        fields: [
          { name: "⚔️ Achievement", value: "`THIRD BLOOD`", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true },
          { name: "🎯 Challenge", value: `\`${challengeTitle.length > 25 ? challengeTitle.substring(0, 25) + "..." : challengeTitle}\``, inline: true }
        ],
        thumbnail: {
          url: "https://i.imgur.com/5K8zXqW.png"
        },
        footer: {
          text: "🥉 NETANIX CTF • Third Blood",
          icon_url: "https://i.imgur.com/5K8zXqW.png"
        },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.firstBlood, embed);
    } catch (err) {
      console.error("Error in sendThirdBlood:", err);
      return false;
    }
  },

  /**
   * 🩸 BLOOD NOTIFICATION — SMART DISPATCH
   */
  async sendBloodNotification(solveCount, solverUsername, challengeTitle) {
    try {
      if (solveCount === 1) return await this.sendFirstBlood(solverUsername, challengeTitle);
      if (solveCount === 2) return await this.sendSecondBlood(solverUsername, challengeTitle);
      if (solveCount === 3) return await this.sendThirdBlood(solverUsername, challengeTitle);
      return false;
    } catch (err) {
      console.error("Error in sendBloodNotification:", err);
      return false;
    }
  },

  /**
   * 🧩 NEW CHALLENGE — CLEAN, NO CATEGORY, NO DIFFICULTY, NO AUTHOR
   */
  async sendNewChallenge(challengeTitle) {
    try {
      console.log(`🎯 Sending New Challenge: ${challengeTitle}`);

      const embed = {
        title: `🔥 **NEW CHALLENGE UNLOCKED!**`,
        description: `## 🎯 **${challengeTitle}**\n\n> *A new challenge has dropped!*\n\n**Can you be the first to solve it?**`,
        color: 0x3498DB, // Bright blue
        // ❌ NO category, difficulty, or status fields
        thumbnail: {
          url: "https://imgur.com/a/cAmdOaK"
        },
        footer: {
          text: "🧩 NETANIX CTF • New Challenge",
          icon_url: "https://imgur.com/a/cAmdOaK"
        },
        timestamp: new Date().toISOString()
      };

      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendNewChallenge:", err);
      return false;
    }
  },

  /**
   * 🏅 CHALLENGE SOLVED — (Bonus, kept for completeness)
   */
  async sendChallengeSolved(solverUsername, challengeTitle, solveCount = null) {
    try {
      const embed = {
        title: "✅ Challenge Solved",
        description: `**${solverUsername}** just solved **${challengeTitle}**! 🎉`,
        color: 0x00D166,
        fields: solveCount ? [
          {
            name: "🔢 Total Solves",
            value: `${solveCount} solver${solveCount !== 1 ? 's' : ''}`,
            inline: true
          }
        ] : [],
        footer: {
          text: "NETANIX CTF"
        },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendChallengeSolved:", err);
      return false;
    }
  }
};
