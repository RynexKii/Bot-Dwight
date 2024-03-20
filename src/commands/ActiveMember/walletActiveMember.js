const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Instanciando a o arquivo activeMember do banco de dados e pegando a tabela memberPoints
const database = {
  activeMember: new QuickDB({ table: "memberPoints", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

module.exports = {
  data: new SlashCommandBuilder().setName("bloods").setDescription("Consulte o seu saldo de Bloods 🩸"),

  async execute(interaction) {
    // Pega o ID do usuário que esta interagindo com o comando
    const userId = interaction.user.id;

    // Pega o Nome principal do usuário
    const userName = interaction.user.displayName;

    // Pega a URL do avatar do usuário
    const userIcon = interaction.user.displayAvatarURL();

    // Pega os pontos do usuário que interagiu com o comando na tabela de memberPoints
    let getPointsDatabase = await (await database.activeMember.tableAsync("memberPoints")).get(`${userId}.points`);

    // Caso o valor retornado seja undefined ou null ele troca o valor por 0
    if (getPointsDatabase === undefined || getPointsDatabase === null) {
      getPointsDatabase = 0;
    }

    const embedWallet = new EmbedBuilder()
      .setAuthor({ name: `${userName}`, iconURL: userIcon })
      .setDescription(`* Saldo \`\`ﾠ${getPointsDatabase} Bloods 🩸\`\``)
      .setColor("#ffffff")
      .setFooter({ text: "Dead by Daylight - Brasil ©", iconURL: "https://i.imgur.com/CRuULKd.png" });

    await interaction.reply({ embeds: [embedWallet], ephemeral: true });
  },
};
