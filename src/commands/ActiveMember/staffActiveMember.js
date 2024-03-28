const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Cria uma tabela para salvar os ID's dos canais
const database = {
  activeMember: new QuickDB({ table: "channelsID", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "memberBloods", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membro-ativo")
    .setDescription("Comandos para a staff utilizar relacionado a Bloods.")
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("configurações")
        .setDescription("Utilize para configurar os canais e verificar quais deles não oferecerão Bloods.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("canais")
            .setDescription("Por favor, identifique os canais que não concederão Bloods.")
            .addStringOption((option) =>
              option
                .setName("adicionar-remover")
                .setDescription("Selecione a opção")
                .setRequired(true)
                .addChoices({ name: "+ Adicionar", value: "addOptionChannel" }, { name: "- Remover", value: "removeOptionChannel" })
            )
            .addChannelOption((option) => option.setName("canal").setDescription("Escolha o canal").setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName("ver").setDescription("Reveja os canais configurados que não fornecerão Bloods."))
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("bloods")
        .setDescription("Utilize para configurar os canais e verificar quais deles não oferecerão Bloods.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("adicionar-remover")
            .setDescription("Utilizado para adicionar ou remover Bloods de algum usuário.")
            .addStringOption((option) =>
              option
                .setName("adicionar-remover")
                .setDescription("Selecione a opção")
                .setRequired(true)
                .addChoices({ name: "+ Adicionar", value: "addOptionBloods" }, { name: "- Remover", value: "removeOptionBloods" })
            )
            .addNumberOption((option) =>
              option
                .setName("valor")
                .setDescription("Coloque o valor que você queira adicionar ou remover de Bloods")
                .setMinValue(1)
                .setMaxValue(10000)
                .setRequired(true)
            )
            .addUserOption((option) => option.setName("usuário").setDescription("Escolha o usuário").setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("reset")
            .setDescription("Usado para resetar os Bloods de algum usuário.")
            .addUserOption((option) => option.setName("usuário").setDescription("Escolha o usuário").setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("ver")
            .setDescription("Utilizado para ver os Bloods de algum usuário.")
            .addUserOption((option) => option.setName("usuário").setDescription("Escolha o usuário").setRequired(true))
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Grupo de Sub Comandos de Configurações
    if (interaction.options.getSubcommandGroup() === "configurações") {
      if (interaction.options.getSubcommand() === "canais") {
        // Pega a opção selecionada de addOptionChannel ou removeOptionChannel do slash command
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

        // Caso a opção for addOptionChannel ele vai cair nesse if
        if (getInputOption === "addOptionChannel") {
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

          // Caso a opção for removeOptionChannel ele vai cair nesse if
        } else if (getInputOption === "removeOptionChannel") {
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
      } else if (interaction.options.getSubcommand() === "ver") {
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
    }
    // Grupo de Sub Comandos de bloods
    else if (interaction.options.getSubcommandGroup() === "bloods") {
      if (interaction.options.getSubcommand() === "adicionar-remover") {
        // Pega a opção selecionada de addOptionBloods ou removeOptionBloods do slash command
        const getInputOption = interaction.options._hoistedOptions[0].value;

        // Pega o Valor que foi inserido no slash command
        const getValueOption = Math.round(interaction.options._hoistedOptions[1].value);

        // Pega o ID do usuário que foi inserido no slash command
        const getMemberOption = interaction.options._hoistedOptions[2].value;

        // Pega os Bloods do usuário que foi enviado no slash command
        const getBloodsDatabase = await (await database.activeMember.tableAsync("memberBloods")).get(`${getMemberOption}.bloods`);

        // Caso tente enviar Bloods para um bot ele para aqui e retorna uma mensagem
        if (interaction.guild.members.cache.get(getMemberOption).user.bot) {
          const embedSendBloodsBot = new EmbedBuilder()
            .setDescription("### <:error:1212567041094058057> [Error] Desculpe, você não pode enviar ou remover `ﾠBloods 🩸` de um bot.")
            .setColor("#ff0000");

          return await interaction.reply({ embeds: [embedSendBloodsBot], ephemeral: true });
        }

        if (getInputOption === "addOptionBloods") {
          const embedSendBloods = new EmbedBuilder()
            .setDescription(
              `### <:add:1212567044428533760> [Enviado] Você enviou \`ﾠ${getValueOption} Bloods 🩸\` para <@${getMemberOption}> com sucesso!`
            )
            .setColor("#15ff00");

          await (await database.activeMember.tableAsync("memberBloods")).add(`${getMemberOption}.bloods`, getValueOption);

          await interaction.reply({ embeds: [embedSendBloods], ephemeral: true });
        } else if (getInputOption === "removeOptionBloods") {
          // Caso o usuário ainda não tem Bloods ou tenha 0 de Bloods ele retorna uma mensagem
          if (getBloodsDatabase === null || getBloodsDatabase === undefined || getBloodsDatabase === 0) {
            const embedEmptyBloods = new EmbedBuilder()
              .setDescription("### <:error:1212567041094058057> [Error] Não há `ﾠ Bloods 🩸` para ser removido deste usuário.")
              .setColor("#ff0000");

            return await interaction.reply({ embeds: [embedEmptyBloods], ephemeral: true });
          }

          // Caso o valor que foi passado no slash command seja menor que os Bloods que o usuário tenha ele para aqui retornando uma mensagem
          if (getBloodsDatabase < getValueOption) {
            const embedLowValue = new EmbedBuilder()
              .setDescription(
                `### <:error:1212567041094058057> [Error] O usuário <@${getMemberOption}> possui apenas \`ﾠ${getBloodsDatabase} Bloods 🩸\``
              )
              .setColor("#ff0000");

            return await interaction.reply({ embeds: [embedLowValue], ephemeral: true });
          }

          // Remove o saldo reduzindo o valor que o usuário tem de Bloods - o valor passado no slash command
          await (await database.activeMember.tableAsync("memberBloods")).set(`${getMemberOption}.bloods`, getBloodsDatabase - getValueOption);

          const embedSendSuccess = new EmbedBuilder()
            .setDescription(
              `### <:add:1212567044428533760> [Removido] O total de \`ﾠ${getValueOption} Bloods 🩸\` foi retirado do usuário <@${getMemberOption}>.`
            )
            .setColor("#ff0000");

          await interaction.reply({ embeds: [embedSendSuccess], ephemeral: true });
        }
      } else if (interaction.options.getSubcommand() === "reset") {
        // Pega o ID do usuário passado no slash command
        const getMemberIDOption = interaction.options._hoistedOptions[0].value;

        const getBloodsMember = await (await database.activeMember.tableAsync("memberBloods")).get(`${getMemberIDOption}.bloods`);

        // Caso tente enviar Bloods para um bot ele para aqui e retorna uma mensagem
        if (interaction.guild.members.cache.get(getMemberIDOption).user.bot) {
          const embedSendBloodsBot = new EmbedBuilder()
            .setDescription("### <:error:1212567041094058057> [Error] Desculpe, você não pode dar reset nos `ﾠBloods 🩸` de um bot.")
            .setColor("#ff0000");

          return await interaction.reply({ embeds: [embedSendBloodsBot], ephemeral: true });
        }

        await (await database.activeMember.tableAsync("memberBloods")).set(`${getMemberIDOption}.bloods`, 0);

        const embedSuccessReset = new EmbedBuilder()
          .setDescription(
            `### <:success:1212567042738233385> [Reset] Todos os \`ﾠ${getBloodsMember} Bloods 🩸\` de <@${getMemberIDOption}>  foram removidos com sucesso.`
          )
          .setColor("#15ff00");

        await interaction.reply({ embeds: [embedSuccessReset], ephemeral: true });
      } else if (interaction.options.getSubcommand() === "ver") {
        const getMemberIDOption = interaction.options._hoistedOptions[0].value;

        const getMemberBloods = await (await database.activeMember.tableAsync("memberBloods")).get(`${getMemberIDOption}.bloods`);

        // Caso tente enviar Bloods para um bot ele para aqui e retorna uma mensagem
        if (interaction.guild.members.cache.get(getMemberIDOption).user.bot) {
          const embedViewBloodsBot = new EmbedBuilder()
            .setDescription("### <:error:1212567041094058057> [Error] Desculpe, você não pode ver os `ﾠBloods 🩸` de um bot.")
            .setColor("#ff0000");

          return await interaction.reply({ embeds: [embedViewBloodsBot], ephemeral: true });
        }

        if (getMemberBloods) {
          const embed = new EmbedBuilder()
            .setDescription(`### Esse usuário <@${getMemberIDOption}> possui  \`ﾠ${getMemberBloods} Bloods 🩸\`.`)
            .setColor("#ff0000");

          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
    }
  },
};
