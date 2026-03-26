const fs = require("fs");
const path = require("path");
const request = require("request");
const Canvas = require("canvas");
const moment = require("moment-timezone");

module.exports.config = {
  name: "up",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "HRIDOY",
  description: "Show bot uptime on a stylish background",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users, Threads }) {
  const { threadID } = event;

  // ⏱ Bot stats
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const totalUsers = global.data.allUserID.length;
  const totalThreads = global.data.allThreadID.length;

  const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss");

  // 🌄 Random background
  const backgrounds = [
    "https://i.ibb.co/0yxzRmvR/image0.jpg",
    "https://i.ibb.co/hFKjhgVQ/image0.jpg",
    "https://i.ibb.co/gZgzQKcV/image0.jpg",
    "https://i.ibb.co/rRMGWq3R/image0.jpg",
    "https://i.ibb.co/cc2JtrRY/image0.jpg",
    "https://i.ibb.co/qFDRJ9VN/image0.jpg"
  ];
  const bgLink = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  // 🖌 Load background
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const bgPath = path.join(cacheDir, "bg.jpg");
  await new Promise((resolve, reject) => {
    request(bgLink)
      .pipe(fs.createWriteStream(bgPath))
      .on("close", resolve)
      .on("error", reject);
  });

  // 🎨 Canvas
  const canvas = Canvas.createCanvas(900, 500);
  const ctx = canvas.getContext("2d");

  const background = await Canvas.loadImage(bgPath);
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // 🔹 Dark overlay for readability
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 🔹 Text settings
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 3;
  ctx.font = "bold 36px Sans-serif";

  const lines = [
    "🤖 BOT STATUS",
    `Time       : ${timeNow}`,
    `Uptime     : ${hours}h ${minutes}m ${seconds}s`,
    `Total Groups: ${totalThreads}`,
    `Total Users : ${totalUsers}`
  ];

  let y = 70;
  for (const line of lines) {
    ctx.strokeText(line, 40, y);
    ctx.fillText(line, 40, y);
    y += 60;
  }

  // 🔹 Footer / signature
  ctx.font = "italic 24px Sans-serif";
  ctx.fillStyle = "#FFD700";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.strokeText("— Powered by TORU CHAN", 40, canvas.height - 30);
  ctx.fillText("— Powered by TORU CHAN", 40, canvas.height - 30);

  // 💾 Save final image
  const outPath = path.join(cacheDir, "up.jpg");
  fs.writeFileSync(outPath, canvas.toBuffer());

  // 📤 Send message
  api.sendMessage(
    {
      body: "📊 Bot Uptime & Stats",
      attachment: fs.createReadStream(outPath)
    },
    threadID,
    () => fs.unlinkSync(outPath)
  );
};
