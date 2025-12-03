import axios from "axios";

const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c",
};

export async function sendDiscordNotification(type, payload) {
  try {
    let webhook = null;
    let embed = null;

    // ===================== FIRST BLOOD =====================
    if (type === "firstBlood") {
      webhook = WEBHOOKS.firstBlood;

      embed = {
        title: "🔥 FIRST BLOOD!",
        description: `**${payload.solverName}** claimed **FIRST BLOOD** on **${payload.challengeName}**!`,
        color: 0xff0000,
        thumbnail: {
          url: "https://i.imgur.com/2yaf2zK.png" // nice red flame icon
        },
        fields: [
          { name: "🏆 Points", value: `${payload.points}`, inline: true },
          { name: "⏱ Time", value: `${payload.time}`, inline: true }
        ],
        footer: { text: "Netanix CTF — First Blood Event" },
        timestamp: new Date().toISOString(),
      };
    }

    // ===================== NEW CHALLENGE =====================
    if (type === "challenge") {
      webhook = WEBHOOKS.challenge;

      embed = {
        title: "🧩 New Challenge Released!",
        description: `A new challenge is now live: **${payload.challengeName}**`,
        color: 0x3498db,
        thumbnail: {
          url: "https://i.imgur.com/zfQxQDj.png" // puzzle icon
        },
        fields: [
          { name: "🔥 Difficulty", value: payload.difficulty, inline: true },
          { name: "🎯 Category", value: payload.category, inline: true },
        ],
        footer: { text: "Netanix CTF — Challenge Update" },
        timestamp: new Date().toISOString(),
      };
    }

    // =============== SEND TO DISCORD =================
    await axios.post(webhook, { embeds: [embed] });

  } catch (err) {
    console.error("Discord Notification Error:", err.response?.data || err);
  }
}
