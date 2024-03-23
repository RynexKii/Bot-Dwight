const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { activeMemberRoleId, activeMemberLogChannel, sendCommandsChannel } = require("../../../config.json");
const { QuickDB } = require("quick.db");
const { join } = require("path");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Instanciando a o arquivo activeMember do banco de dados e pegando a tabela memberBloods
const database = {
  activeMember: new QuickDB({ table: "memberBloods", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "activeMemberDuration", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Veja todos os itens da loja no momento")
    .addStringOption((option) =>
      option
        .setName("comprar")
        .setDescription("Adquira a sua assinatura de Membro Ativo, válida por 30 dias.")
        .setRequired(true)
        .addChoices({ name: "[Cargo] Membro Ativo", value: "buyAtiveMember" })
    ),

  async execute(interaction) {
    // Pegando o ID do usuário que está enviando o comando
    const userId = interaction.user.id;

    // Pega o Nome principal do usuário
    const userName = interaction.user.displayName;

    // Pega a URL do avatar do usuário
    const userIcon = interaction.user.displayAvatarURL();

    // --- Coloque o valor que vai custar para comprar o cargo de Membro Ativo ---
    const getValueActiveMember = 5000;

    // Passa o ID do cargo que vai ser dado ao usuário (EDITAR)
    const getActiveMemberRole = activeMemberRoleId;

    // Pega o timestamp que foi armazenado no usuário na tabela activeMemberDuration
    const getTimestampDatabase = await (await database.activeMember.tableAsync("activeMemberDuration")).get(`${userId}.timestampDuration`);

    // Pega os pontos que o usuário tem na database na tabela de memberBloods
    let getBloodsDatabase = await (await database.activeMember.tableAsync("memberBloods")).get(`${userId}.bloods`);

    // Pega o timestamp atual
    let timestamp = +new Date();

    // Caso o canal for diferente do canal sendCommandsChannel ele retorna uma mensagem e para aqui
    if (interaction.channel.id !== sendCommandsChannel) {
      const embedBlockChannel = new EmbedBuilder()
        .setDescription(
          `### <:error:1212567041094058057> [Error] Por favor, utilize apenas o canal <#${sendCommandsChannel}> para enviar este comando!`
        )
        .setColor("#ff0000");

      return await interaction.reply({ embeds: [embedBlockChannel], ephemeral: true });
    }

    // Criando o botão de Confirmar
    const buttonConfirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirmar")
      .setStyle(ButtonStyle.Success)
      .setEmoji("1212567042738233385");

    // Criando o botão de Cancelar
    const buttonCancel = new ButtonBuilder().setCustomId("cancel").setLabel("Cancelar").setStyle(ButtonStyle.Danger).setEmoji("1212567041094058057");

    // Juntando os 2 botões em uma ActionRow
    const rowButtons = new ActionRowBuilder().addComponents(buttonConfirm, buttonCancel);

    // Caso o valor retornado seja undefined ou null ele troca o valor por 0
    if (getBloodsDatabase === undefined || getBloodsDatabase === null) {
      getBloodsDatabase = 0;
    }

    // Caso exista um valor no getTimestampDatabase ele retorna uma mensagem que a assinatura ainda esta ativa
    if (getTimestampDatabase) {
      const embedAlready = new EmbedBuilder()
        .setAuthor({ name: `${userName}`, iconURL: userIcon })
        .setDescription(
          `Sua assinatura como <@&${getActiveMemberRole}> ainda está válida e permanecerá ativa até o dia <t:${getTimestampDatabase}:f>`
        )
        .setColor("#ff0000");

      return await interaction.reply({ content: `<@${userId}>`, embeds: [embedAlready] });
    }

    // Caso o valor que o usuário tenha for menor que getValueActiveMember ele retorna mandando uma mensagem de saldo insuficiente
    if (getBloodsDatabase < getValueActiveMember) {
      const embedInsufficientValue = new EmbedBuilder()
        .setAuthor({ name: `${userName}`, iconURL: userIcon })
        .setDescription(
          `* Você tem apenas \`ﾠ${getBloodsDatabase} Bloods 🩸\` disponíveis.
          * Você precisará de mais \`ﾠ${getValueActiveMember - getBloodsDatabase} Bloods 🩸\` para adquirir o cargo desejado!`
        )
        .setColor("#ff0000");
      return await interaction.reply({ content: `<@${userId}>`, embeds: [embedInsufficientValue] });
    }

    const embedBuy = new EmbedBuilder()
      .setTitle("Membro Ativo")
      .setDescription(
        `O Cargo de Membro Ativo é uma assinatura especial que oferece uma série de vantagens exclusivas para os membros dedicados de nossa comunidade no Discord. Ao adquirir este cargo, você se torna parte de um grupo seleto de membros que desfrutam de privilégios especiais e uma atmosfera ainda mais envolvente.
    
    **Valor \`ﾠ${getValueActiveMember} Bloods 🩸\`**
    
    **Estoque \`♾️\`**

    **Duração \`30 Dias\`**

    **Você receberá o cargo <@&${getActiveMemberRole}>**
    
    **Esta mensagem desaparecerá <t:${Math.round((timestamp + 30000) / 1000)}:R>**
    `
      )
      .setColor("#ffffff");

    // Envia e armazena a mensagem embedBuy com os botões juntos
    const sendEmbedBuy = await interaction.reply({ content: `<@${userId}>`, embeds: [embedBuy], components: [rowButtons] });

    // Deleta a mensagem sendEmbedBuy após 30 segundos que o comando slash command foi chamado
    const deleteTimeout = setTimeout(() => {
      sendEmbedBuy.delete();
    }, 30 * 1000);

    try {
      // Cria um filtro para que apenas o usuário que mandou o comando interaja com os botões de confirm e cancel
      const collectorFilter = (i) => i.user.id === interaction.user.id;

      // Adiciona o filtro na mensagem sendEmbedBuy e cria a interação com os botões
      const confirmation = await sendEmbedBuy.awaitMessageComponent({ filter: collectorFilter });

      if (confirmation.customId === "confirm") {
        // Caso exista um valor no getTimestampDatabase ele retorna uma mensagem que a assinatura ainda esta ativa
        if (getTimestampDatabase) {
          const embedAlready = new EmbedBuilder()
            .setAuthor({ name: `${userName}`, iconURL: userIcon })
            .setDescription(
              `Sua assinatura como <@&${getActiveMemberRole}> ainda está válida e permanecerá ativa até o dia <t:${getTimestampDatabase}:f>`
            )
            .setColor("#ff0000");

          return await confirmation.update({ content: `<@${userId}>`, embeds: [embedAlready] });
        }

        // Adiciona 30 dias no timestamp
        timestamp += 30 * 24 * 60 * 60 * 1000;

        // Divide por 1000 e tira tudo depois do ponto
        timestamp = Math.round(timestamp / 1000);

        // Armazena o timestamp na database
        await (await database.activeMember.tableAsync("activeMemberDuration")).set(`${userId}.timestampDuration`, timestamp);

        // Adiciona o cargo no usuário que foi passado na variável getActiveMemberRole
        await interaction.member.roles.add(getActiveMemberRole);

        // Diminue os pontos que vem da database (getBloodsDatabase) pelos pontos passado na variável getValueActiveMember
        getBloodsDatabase -= getValueActiveMember;

        // Seta os pontos restante na tabela de memberBloods da database
        await (await database.activeMember.tableAsync("memberBloods")).set(`${userId}.bloods`, getBloodsDatabase);

        const embedBuySuccess = new EmbedBuilder()
          .setAuthor({ name: `${userName}`, iconURL: userIcon })
          .setDescription(`Você adquiriu o cargo de <@&${getActiveMemberRole}>, e ele permanecerá válido até o dia: <t:${timestamp}:f>`)
          .setColor("#15ff00");

        // Atualiza a mensagem sendEmbedBuy para embedBuySuccess
        await confirmation.update({ embeds: [embedBuySuccess], components: [] });

        // Parte de logs Staff

        const channel = interaction.guild.channels.cache.get(activeMemberLogChannel);

        const embedUserBuySuccess = new EmbedBuilder()
          .setDescription(`### <:add:1212567044428533760> [Log] O membro <@${userId}> obteve o cargo de <@&${getActiveMemberRole}> através da loja.`)
          .setColor("#15ff00");

        channel.send({ embeds: [embedUserBuySuccess] });

        // Limpa o Timeout criado para deletar a mensagem
        clearTimeout(deleteTimeout);
      } else if (confirmation.customId === "cancel") {
        const embedBuyCancel = new EmbedBuilder()
          .setAuthor({ name: `${userName}`, iconURL: userIcon })
          .setDescription(`Sua compra foi cancelada com sucesso.`)
          .setColor("#15ff00");

        await confirmation.update({ embeds: [embedBuyCancel], components: [] });

        // Limpa o Timeout criado para deletar a mensagem
        clearTimeout(deleteTimeout);
      }
    } catch (e) {}
  },
};
