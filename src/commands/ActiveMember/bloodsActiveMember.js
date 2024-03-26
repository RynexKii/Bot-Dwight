const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendCommandsChannel, guildId } = require("../../../config.json");
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
  data: new SlashCommandBuilder()
    .setName("bloods")
    .setDescription("Consulte o seu saldo de Bloods")
    .addSubcommand((subcommand) => subcommand.setName("ver").setDescription("Consulte o seu saldo de Bloods."))
    .addSubcommand((subcommand) => subcommand.setName("rank").setDescription("Veja os tops rank do servidor.")),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === "ver") {
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

      // Pega o Array de ordenado por saldo de Bloods da database
      const getMembersRank = await (await database.activeMember.tableAsync("memberBloodsRanks")).get(guildId);

      // Criado para armazenar o rank
      let userRank = "Sem Rank";

      // Procura o ID do usuário que fez o comando e retorna o número do rank dela
      getMembersRank.forEach((element) => {
        if (element.userID === userId) {
          userRank = element.userRank;
        }
      });

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
        .setDescription(
          `Saldo \`ﾠ${getBloodsDatabase} Bloods 🩸\`
        Rank \`ﾠ${userRank}º / ${getMembersRank.length}ﾠ\`
        `
        )
        .setColor("#2b2d31");

      await interaction.reply({ content: `<@${userId}>`, embeds: [embedBloodsWallet] });
    } else if (interaction.options.getSubcommand() === "rank") {
      // Pega o Array de ordenado por saldo de Bloods da database
      const getMembersRank = await (await database.activeMember.tableAsync("memberBloodsRanks")).get(guildId);

      // Criado as 5 variáveis para armazenar os top 5 com mais Bloods
      let rankOne = "1º Ninguém";
      let rankTwo = "2º Ninguém";
      let rankThree = "3º Ninguém";
      let rankFour = "4º Ninguém";
      let rankFive = "5º Ninguém";

      // Verifica o getMembersRank um por um até o 5 para colocar na variável
      if (getMembersRank[0]) {
        rankOne = `1º <@${getMembersRank[0].userID}> \`ﾠ${getMembersRank[0].userBloods} Bloods 🩸\``;
      }
      if (getMembersRank[1]) {
        rankTwo = `2º <@${getMembersRank[1].userID}> \`ﾠ${getMembersRank[1].userBloods} Bloods 🩸\``;
      }
      if (getMembersRank[2]) {
        rankThree = `3º <@${getMembersRank[2].userID}> \`ﾠ${getMembersRank[2].userBloods} Bloods 🩸\``;
      }
      if (getMembersRank[3]) {
        rankFour = `4º <@${getMembersRank[3].userID}> \`ﾠ${getMembersRank[3].userBloods} Bloods 🩸\``;
      }
      if (getMembersRank[4]) {
        rankFive = `5º <@${getMembersRank[4].userID}> \`ﾠ${getMembersRank[4].userBloods} Bloods 🩸\``;
      }

      const embedTopRank = new EmbedBuilder()
        .setAuthor({ name: "Top 5 Bloods", iconURL: "https://i.imgur.com/h0S883Y.png" })
        .setDescription(
          `${rankOne}
      ${rankTwo}
      ${rankThree}
      ${rankFour}
      ${rankFive}`
        )
        .setColor("#ff0000");

      await interaction.reply({ embeds: [embedTopRank] });
    }
  },
};
