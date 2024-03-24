const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendCommandsChannel } = require("../../../config.json");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Instanciando a o arquivo activeMember do banco de dados e pegando a tabela memberBloods
const database = {
  activeMember: new QuickDB({ table: "memberBloods", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

// Essas 2 variável é para o sistema de Cooldown
const cooldown = [];
let timestampNow;

module.exports = {
  data: new SlashCommandBuilder().setName("bloods").setDescription("Consulte o seu saldo de Bloods"),

  async execute(interaction) {
    // Coloca um Cooldown de 60 segundos no comando e responde com uma mensagem
    const timeSeconds = 60 * 1000;

    if (cooldown.includes(interaction.user.id))
      return await interaction.reply({
        content: `<:waiting:1221553835697504276> Você poderá executar esse comando novamente <t:${timestampNow}:R>.`,
        ephemeral: true,
      });

    cooldown.push(interaction.user.id);
    setTimeout(() => {
      cooldown.shift();
    }, timeSeconds);

    timestampNow = Math.round(+new Date() / 1000) + 60;
    // Aqui termina o sistema de Cooldown

    // Pega o ID do usuário que esta interagindo com o comando
    const userId = interaction.user.id;

    // Pega o Nome principal do usuário
    const userName = interaction.user.displayName;

    // Pega a URL do avatar do usuário
    const userIcon = interaction.user.displayAvatarURL();

    // Pega os pontos do usuário que interagiu com o comando na tabela de memberBloods
    let getBloodsDatabase = await (await database.activeMember.tableAsync("memberBloods")).get(`${userId}.bloods`);

    // Caso o canal for diferente do canal sendCommandsChannel ele retorna uma mensagem e para aqui
    if (interaction.channel.id !== sendCommandsChannel) {
      const embedBlockChannel = new EmbedBuilder()
        .setDescription(
          `### <:error:1212567041094058057> [Error] Por favor, utilize apenas o canal <#${sendCommandsChannel}> para enviar este comando!`
        )
        .setColor("#ff0000");

      return await interaction.reply({ embeds: [embedBlockChannel], ephemeral: true });
    }

    // Caso o valor retornado seja undefined ou null ele troca o valor por 0
    if (getBloodsDatabase === undefined || getBloodsDatabase === null) {
      getBloodsDatabase = 0;
    }

    const embedBloodsWallet = new EmbedBuilder()
      .setAuthor({ name: `${userName}`, iconURL: userIcon })
      .setDescription(`* Saldo \`\`ﾠ${getBloodsDatabase} Bloods 🩸\`\``)
      .setColor("#ffffff")
      .setFooter({ text: "Dead by Daylight - Brasil ©", iconURL: "https://i.imgur.com/CRuULKd.png" });

    await interaction.reply({ content: `<@${userId}>`, embeds: [embedBloodsWallet] });
  },
};
