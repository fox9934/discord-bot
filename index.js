const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const PREFIX = "!";

const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  emitNewSongOnly: true,
  joinNewVoiceChannel: true,
});

// ======= BOT READY =======
client.once("ready", () => {
  console.log(`✅ Bot شغال: ${client.user.tag}`);
  client.user.setActivity("🎵 الموسيقى", { type: ActivityType.Listening });
});

// ======= MESSAGES =======
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const voiceChannel = message.member?.voice?.channel;

  // Helper: embed
  const embed = (desc, color = "#5865F2") =>
    new EmbedBuilder().setDescription(desc).setColor(color);

  // ======= PLAY =======
  if (command === "play" || command === "p") {
    if (!voiceChannel)
      return message.reply({ embeds: [embed("❌ ادخل voice channel الأول!", "#ED4245")] });
    if (!args.length)
      return message.reply({ embeds: [embed("❌ اكتب اسم أغنية أو رابط!", "#ED4245")] });

    const query = args.join(" ");
    try {
      await distube.play(voiceChannel, query, {
        member: message.member,
        textChannel: message.channel,
        message,
      });
    } catch (err) {
      message.reply({ embeds: [embed(`❌ خطأ: ${err.message}`, "#ED4245")] });
    }
  }

  // ======= SKIP =======
  else if (command === "skip" || command === "s") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    queue.skip();
    message.reply({ embeds: [embed("⏭️ تم التخطي للأغنية الجاية!")] });
  }

  // ======= PAUSE =======
  else if (command === "pause") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    queue.pause();
    message.reply({ embeds: [embed("⏸️ تم الإيقاف المؤقت!")] });
  }

  // ======= RESUME =======
  else if (command === "resume" || command === "r") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    queue.resume();
    message.reply({ embeds: [embed("▶️ تم الاستكمال!")] });
  }

  // ======= STOP =======
  else if (command === "stop") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    queue.stop();
    message.reply({ embeds: [embed("⏹️ تم الإيقاف وتفريغ القايمة!", "#ED4245")] });
  }

  // ======= QUEUE =======
  else if (command === "queue" || command === "q") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ القايمة فاضية!", "#ED4245")] });

    const songs = queue.songs
      .slice(0, 10)
      .map((s, i) => `${i === 0 ? "🎵" : `${i}.`} **${s.name}** - ${s.formattedDuration}`)
      .join("\n");

    message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📋 قايمة الأغاني")
          .setDescription(songs)
          .setColor("#5865F2")
          .setFooter({ text: `إجمالي: ${queue.songs.length} أغنية` }),
      ],
    });
  }

  // ======= VOLUME =======
  else if (command === "volume" || command === "v") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    const vol = parseInt(args[0]);
    if (isNaN(vol) || vol < 1 || vol > 100)
      return message.reply({ embeds: [embed("❌ الصوت لازم يكون من 1 لـ 100!", "#ED4245")] });
    queue.setVolume(vol);
    message.reply({ embeds: [embed(`🔊 تم ضبط الصوت على **${vol}%**`)] });
  }

  // ======= LOOP =======
  else if (command === "loop") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    const mode = queue.repeatMode === 0 ? 1 : 0;
    queue.setRepeatMode(mode);
    message.reply({ embeds: [embed(mode === 1 ? "🔁 Loop تم تفعيله!" : "➡️ Loop تم إيقافه!")] });
  }

  // ======= NOW PLAYING =======
  else if (command === "np") {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply({ embeds: [embed("❌ مفيش أغاني شغالة!", "#ED4245")] });
    const song = queue.songs[0];
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎵 بيشتغل دلوقتي")
          .setDescription(`**${song.name}**\nالمدة: ${song.formattedDuration}`)
          .setThumbnail(song.thumbnail)
          .setColor("#5865F2"),
      ],
    });
  }

  // ======= HELP =======
  else if (command === "help") {
    message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎵 أوامر البوت")
          .setColor("#5865F2")
          .addFields(
            { name: "🎵 تشغيل", value: "`!play [اسم/رابط]` أو `!p`", inline: true },
            { name: "⏭️ تخطي", value: "`!skip` أو `!s`", inline: true },
            { name: "⏸️ إيقاف مؤقت", value: "`!pause`", inline: true },
            { name: "▶️ استكمال", value: "`!resume` أو `!r`", inline: true },
            { name: "⏹️ وقف", value: "`!stop`", inline: true },
            { name: "📋 القايمة", value: "`!queue` أو `!q`", inline: true },
            { name: "🔊 الصوت", value: "`!volume [1-100]` أو `!v`", inline: true },
            { name: "🔁 لوب", value: "`!loop`", inline: true },
            { name: "🎵 بيشتغل", value: "`!np`", inline: true }
          ),
      ],
    });
  }
});

// ======= DISTUBE EVENTS =======
distube
  .on("playSong", (queue, song) => {
    queue.textChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎵 بيشتغل دلوقتي")
          .setDescription(`**${song.name}**\nالمدة: ${song.formattedDuration}\nطلبه: ${song.user}`)
          .setThumbnail(song.thumbnail)
          .setColor("#57F287"),
      ],
    });
  })
  .on("addSong", (queue, song) => {
    queue.textChannel?.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(`✅ **${song.name}** اتضافت للقايمة!`)
          .setColor("#5865F2"),
      ],
    });
  })
  .on("error", (channel, error) => {
    console.error("DisTube Error:", error);
    channel?.send({ embeds: [new EmbedBuilder().setDescription(`❌ خطأ: ${error.message}`).setColor("#ED4245")] });
  })
  .on("finish", (queue) => {
    queue.textChannel?.send({
      embeds: [new EmbedBuilder().setDescription("✅ خلصت الأغاني كلها!").setColor("#ED4245")],
    });
  });

// ======= LOGIN =======
client.login(process.env.TOKEN);
