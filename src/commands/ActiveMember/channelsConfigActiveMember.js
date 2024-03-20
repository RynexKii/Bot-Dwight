const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Cria uma tabela para salvar os ID's dos canais
const database = {
  activeMember: new QuickDB({ table: "channelsID", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membro-ativo")
    .setDescription("Comando usado para configurar o sistema de Membro Ativo")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("config")
        .setDescription("Selecione os canais que você deseja adicionar ou remover do banco de dados")
        .addStringOption((option) =>
          option
            .setName("adicionar-remover")
            .setDescription("Selecione a opção")
            .setRequired(true)
            .addChoices({ name: "+ Adicionar", value: "addOption" }, { name: "- Remover", value: "removeOption" })
        )
        .addChannelOption((option) => option.setName("channel").setDescription("Escolha o canal").setRequired(true))
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("channels").setDescription("Ver todos os canais que não estão ativos no sistema de Membro Ativo")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Pega qual sub comando esta sendo enviado pelo slash command
    if (interaction.options.getSubcommand() === "config") {
      // Pega a opção selecionada de AddOption ou RemoveOption do slash command
      const getInputOption = interaction.options._hoistedOptions[0].value;

      // Pega o ID do canal que foi inserido no slash command
      const getChannelOption = interaction.options._hoistedOptions[1].value;

      // Pega o tipo se é categoria(4) ou canal de voz(2) ou canal de texto(0)
      const getChannelType = interaction.options._hoistedOptions[1].channel.type;

      // Pega os ID's dos canais que estão inseridos na database
      const getChannelDatabase = await (await database.activeMember.tableAsync("channelsID")).get("allChannels");

      // Função feita para adicionar os canais na database e responder no chat com uma mensagem de sucesso
      async function addChanel() {
        const embedAddSuccess = new EmbedBuilder()
          .setDescription(`### <:add:1212567044428533760> O canal <#${getChannelOption}>  foi adicionado com sucesso!`)
          .setColor("#15ff00");

        if (getChannelType === 4) {
          const embedErrorCategory = new EmbedBuilder()
            .setDescription(`### <:error:1212567041094058057> [Erro] Não é possível incluir uma categoria.`)
            .setColor("#ff0000");

          return await interaction.reply({ embeds: [embedErrorCategory], ephemeral: true });
        } else if (getChannelType === 0) {
          await (await database.activeMember.tableAsync("channelsID")).push("textChannels", getChannelOption);

          await (await database.activeMember.tableAsync("channelsID")).push("allChannels", getChannelOption);

          return await interaction.reply({ embeds: [embedAddSuccess], ephemeral: true });
        } else if (getChannelType === 2) {
          await (await database.activeMember.tableAsync("channelsID")).push("voiceChannels", getChannelOption);

          await (await database.activeMember.tableAsync("channelsID")).push("allChannels", getChannelOption);

          return await interaction.reply({ embeds: [embedAddSuccess], ephemeral: true });
        } else {
          const embedError = new EmbedBuilder()
            .setDescription(`### <:error:1212567041094058057> [Erro] Ocorreu algum erro; por favor, tente novamente.`)
            .setColor("#ff0000");
          return await interaction.reply({ embeds: [embedError], ephemeral: true });
        }
      }

      // Caso a opção for addOption ele vai
      if (getInputOption === "addOption") {
        // Caso o Array de ID's ainda não tenha cido criado, ele vai cair nesse if e criar o Array adicionando o primeiro canal
        if (getChannelDatabase === null) {
          return addChanel();
        }

        // Vai verificar se já existe o canal que foi mandado para registrar e responder com uma mensagem de erro
        if (getChannelDatabase.indexOf(getChannelOption) !== -1) {
          const embedAlreadyRegistered = new EmbedBuilder()
            .setDescription(`### <:error:1212567041094058057> [Erro] O canal <#${getChannelOption}>  já foi adicionado ao banco de dados!`)
            .setColor("#ff0000");
          return await interaction.reply({ embeds: [embedAlreadyRegistered], ephemeral: true });
        }

        // Chamando a função de adicionar canais
        addChanel();

        //Terminar daqui para baixo e testar
      } else if (getInputOption === "removeOption") {
        // Caso tente remover algum canal e a database esta vazia ou apenas com o Array sem os canais ele retorna uma mensagem de erro
        if (getChannelDatabase === null || getChannelDatabase.length === 0) {
          const embedEmptyChannel = new EmbedBuilder()
            .setDescription("### <:error:1212567041094058057> [Erro] Não há nenhum canal registrado no banco de dados para ser removido!")
            .setColor("#ff0000");
          return await interaction.reply({ embeds: [embedEmptyChannel], ephemeral: true });
        }

        // Caso tente remover um canal que não esta na database porem tem outros canais registrado ele vai retornar uma mensagem de erro
        if (getChannelDatabase.indexOf(getChannelOption) === -1) {
          const embedNotChannel = new EmbedBuilder()
            .setDescription(
              `### <:error:1212567041094058057> [Erro] O canal <#${getChannelOption}> ainda não foi adicionado em nosso banco de dados!`
            )
            .setColor("#ff0000");
          return await interaction.reply({ embeds: [embedNotChannel], ephemeral: true });
        }

        // Pega o canal que foi enviado pelo slash command e remove da database e retorna uma mensagem de sucesso
        await (await database.activeMember.tableAsync("channelsID")).pull("allChannels", getChannelOption);

        // Pega o canal que foi enviado pelo slash command e remove o canal da parte de textChannels da database
        if (getChannelType === 0) {
          await (await database.activeMember.tableAsync("channelsID")).pull("textChannels", getChannelOption);
        }

        // Pega o canal que foi enviado pelo slash command e remove o canal da parte de voiceChannels da database
        if (getChannelType === 2) {
          await (await database.activeMember.tableAsync("channelsID")).pull("voiceChannels", getChannelOption);
        }

        const embedRemoveSuccess = new EmbedBuilder()
          .setDescription(`### <:remove:1212567045695213629> O canal <#${getChannelOption}>  foi removido com sucesso!`)
          .setColor("#ff0000");
        await interaction.reply({ embeds: [embedRemoveSuccess], ephemeral: true });
      }
    } else if (interaction.options.getSubcommand() === "channels") {
      // Pega os canais de texto da database
      const getTextChannels = await (await database.activeMember.tableAsync("channelsID")).get("textChannels");

      // Pega os canais de voz da database
      const getVoiceChannels = await (await database.activeMember.tableAsync("channelsID")).get("voiceChannels");

      let messageTextChannels = "";

      let messageVoiceChannels = "";

      // Verifica se a database tem algum valor ou se o Array criada nela esta vazio
      if (getTextChannels === null || getTextChannels.length === 0) {
        messageTextChannels = "`Nenhum canal de texto definido`";
      } else {
        // Percore todos os ID's do Array e armazena eles na variável messageTextChannels passando com a formatação do Discord para mensionar canal
        getTextChannels.forEach((textChannel) => {
          messageTextChannels += `<#${textChannel}> `;
        });
      }

      if (getVoiceChannels === null || getVoiceChannels.length === 0) {
        messageVoiceChannels = "`Nenhum canal de voz definido`";
      } else {
        // Percore todos os ID's do Array e armazena eles na variável messageVoiceChannels passando com a formatação do Discord para mensionar canal
        getVoiceChannels.forEach((voiceChannel) => {
          messageVoiceChannels += `<#${voiceChannel}> `;
        });
      }

      const embed = new EmbedBuilder()
        .setTitle("Canais registrados no banco de dados")
        .setDescription(
          `* Canais de Texto: ${messageTextChannels}\n\n* Canais de Voz: ${messageVoiceChannels}\n\n**Esses canais não contaram pontos para o Membro Ativo**`
        )
        .setColor("#ffffff");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
