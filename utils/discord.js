const axios = require("axios");

// Webhooks loaded from environment variables
const WEBHOOKS = {
  firstBlood: process.env.DISCORD_WEBHOOK_BLOOD || "",
  challenge: process.env.DISCORD_WEBHOOK_CHALLENGE || ""
};

// Random flavor texts
const FIRST_BLOOD_TEXTS = [
  "The hunt begins — who's next?",
  "Lightning fast! ⚡",
  "Absolutely legendary! 🔥",
  "Speed demon! 💨",
  "First strike! 🎯",
  "Elite hacker energy! 💻",
  "Pure domination! 👑",
  "Unstoppable! 🚀"
];

const SECOND_BLOOD_TEXTS = [
  "Hot on the heels of first blood! 🏃",
  "Silver speed! 🥈",
  "Close but not close enough! ⚔️",
  "Strong performance! 💪",
  "Second, but still elite! 🌟"
];

const THIRD_BLOOD_TEXTS = [
  "Bronze glory! 🥉",
  "The podium is complete! 🏆",
  "Third blood drawn! 🗡️",
  "Still in the top 3! 🎯",
  "Respectable finish! 👏"
];

const CHALLENGE_TEXTS = [
  "Can you be the first to solve it?",
  "Time to show your skills! 💪",
  "The race is on! 🏃",
  "Who will crack it first? 🤔",
  "Fresh challenge, fresh glory! ✨",
  "Ready for the hunt? 🎯",
  "Prove your worth! ⚔️",
  "The gauntlet has been thrown! 🔥"
];

function getRandomText(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function sendDiscordEmbed(webhook, embed) {
  if (!webhook) {
    console.warn("⚠️ Discord webhook not configured, skipping notification");
    return false;
  }
  try {
    await axios.post(webhook, { embeds: [embed] });
    console.log("✅ Discord notification sent successfully");
    return true;
  } catch (err) {
    console.error("❌ Discord Error:", err.response?.data || err.message);
    return false;
  }
}

const BANNER_IMAGE = "https://i.imgur.com/OBiq3ap.png";

module.exports = {
  /**
   * 🥇 FIRST BLOOD
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🩸 **FIRST BLOOD CLAIMED!**`,
        description: `## 🏆 **${solverUsername}**\n\n> *Drew the first drop of blood on:*`,
        color: 0xDC143C,
        fields: [
          { name: "🎯 Challenge", value: `# **${challengeTitle}**`, inline: false },
          { name: "\u200B", value: `*${getRandomText(FIRST_BLOOD_TEXTS)}*`, inline: false },
          { name: "⚔️ Achievement", value: "`FIRST BLOOD`  •  **+50% bonus**", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true }
        ],
        image: { url: BANNER_IMAGE },
        footer: {
          text: "🔥 NETANIX CTF • First Blood Event",
          icon_url: BANNER_IMAGE
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
   * 🥈 SECOND BLOOD
   */
  async sendSecondBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🥈 **SECOND BLOOD!**`,
        description: `## **${solverUsername}**\n\n> *Claimed second blood on:*`,
        color: 0xC0C0C0,
        fields: [
          { name: "🎯 Challenge", value: `**${challengeTitle}**`, inline: false },
          { name: "\u200B", value: `*${getRandomText(SECOND_BLOOD_TEXTS)}*`, inline: false },
          { name: "⚔️ Achievement", value: "`SECOND BLOOD`  •  **+25% bonus**", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true }
        ],
        image: { url: BANNER_IMAGE },
        footer: {
          text: "🔥 NETANIX CTF • Blood Event",
          icon_url: BANNER_IMAGE
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
   * 🥉 THIRD BLOOD
   */
  async sendThirdBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🥉 **THIRD BLOOD!**`,
        description: `## **${solverUsername}**\n\n> *Claimed third blood on:*`,
        color: 0xCD7F32,
        fields: [
          { name: "🎯 Challenge", value: `**${challengeTitle}**`, inline: false },
          { name: "\u200B", value: `*${getRandomText(THIRD_BLOOD_TEXTS)}*`, inline: false },
          { name: "⚔️ Achievement", value: "`THIRD BLOOD`  •  **+10% bonus**", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true }
        ],
        image: { url: BANNER_IMAGE },
        footer: {
          text: "🔥 NETANIX CTF • Blood Event",
          icon_url: BANNER_IMAGE
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
   * 🧩 NEW CHALLENGE
   */
  async sendNewChallenge(challengeTitle) {
    try {
      const embed = {
        title: `🔥 **NEW CHALLENGE UNLOCKED!**`,
        description: `## 🎯 **${challengeTitle}**\n\n> *A new challenge has dropped!*`,
        color: 0x3498DB,
        fields: [
          { name: "\u200B", value: `**${getRandomText(CHALLENGE_TEXTS)}**`, inline: false }
        ],
        image: { url: "https://i.imgur.com/HavGjsW.png" },
        footer: { text: "🧩 NETANIX CTF • New Challenge" },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendNewChallenge:", err);
      return false;
    }
  },

  /**
   * ✅ CHALLENGE SOLVED
   */
  async sendChallengeSolved(solverUsername, challengeTitle, solveCount = null) {
    try {
      const embed = {
        title: "✅ Challenge Solved",
        description: `**${solverUsername}** just solved **${challengeTitle}**! 🎉`,
        color: 0x00D166,
        fields: solveCount ? [
          { name: "🔢 Total Solves", value: `${solveCount} solver${solveCount !== 1 ? 's' : ''}`, inline: true }
        ] : [],
        footer: { text: "NETANIX CTF" },
        timestamp: new Date().toISOString()
      };
      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendChallengeSolved:", err);
      return false;
    }
  }
};
