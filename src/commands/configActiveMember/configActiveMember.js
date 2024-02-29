const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { QuickDB } = require("quick.db");
const { join } = require("path")

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado


// Cria uma tabela para salvar os ID's dos canais
const database = {
  activeMember: new QuickDB({ table: "channelsId", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

// prettier-ignored

module.exports = {
  data: new SlashCommandBuilder()
    .setName("active-member")
    .setDescription('Comando usado para configurar o sistema de Membro Ativo')
    .addSubcommand(subcommand =>
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
        .addChannelOption((option) => option
        .setName("channel")
        .setDescription("Escolha o canal")
        .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName("channels")
        .setDescription('Ver todos os canais que não estão ativos no sistema de Membro Ativo')
      ),

  async execute(interaction) {

    // Pega qual sub comando esta sendo enviado pelo slash command
    if (interaction.options.getSubcommand() === "config") {
      
      // Pega a opção selecionada de AddOption ou RemoveOption do slash command
      const getInputOption = interaction.options._hoistedOptions[0].value;
  
      // Pega o ID do canal que foi inserido no slash command
      const getChannelOption = interaction.options._hoistedOptions[1].value;
  
      // Pega os ID's dos canais que estão inseridos na database
      const getChannelDatabase = await database.activeMember.get("channelsId");
  
      // Função feita para adicionar os canais na database e responder no chat com uma mensagem de sucesso
      async function addChanel() {
        const addSuccess = new EmbedBuilder()
          .setDescription(`### <:add:1212567044428533760> O canal <#${getChannelOption}>  foi adicionado com sucesso!`)
          .setColor("#15ff00");
        await database.activeMember.push("channelsId", getChannelOption);
        return await interaction.reply({ embeds: [addSuccess], ephemeral: true });
      }
  
  
      // Caso a opção for addOption ele vai 
      if (getInputOption === "addOption") {
  
        // Caso o Array de ID's ainda não tenha cido criado, ele vai cair nesse if e criar o Array adicionando o primeiro canal
        if (getChannelDatabase === null) {
          return addChanel();
        }
        
        // Vai verificar se já existe o canal que foi mandado para registrar e responder com uma mensagem de erro
        if (getChannelDatabase.indexOf(getChannelOption) !== -1) {
          const alreadyRegistered = new EmbedBuilder()
            .setDescription(`### <:error:1212567041094058057> [Erro] O canal <#${getChannelOption}>  já foi adicionado ao banco de dados!`)
            .setColor("#ff0000");
          return await interaction.reply({ embeds: [alreadyRegistered], ephemeral: true });
        }
  
  
        // Chamando a função de adicionar canais
        addChanel();
  
        //Terminar daqui para baixo e testar
  
      } else if (getInputOption === "removeOption") {
  
        // Caso tente remover algum canal e a database esta vazia ou apenas com o Array sem os canais ele retorna uma mensagem de erro
        if (getChannelDatabase === null || getChannelDatabase.length === 0) {
          const emptyChannel = new EmbedBuilder()
          .setDescription("### <:error:1212567041094058057> [Erro] Não há nenhum canal registrado no banco de dados para ser removido!")
          .setColor("#ff0000");
          return await interaction.reply({ embeds: [emptyChannel], ephemeral: true });
        }
  
  
        // Caso tente remover um canal que não esta na database porem tem outros canais registrado ele vai retornar uma mensagem de erro
        if (getChannelDatabase.indexOf(getChannelOption) === -1) {
          const notChannel = new EmbedBuilder()
          .setDescription(`### <:error:1212567041094058057> [Erro] O canal <#${getChannelOption}> ainda não foi adicionado em nosso banco de dados!`)
          .setColor("#ff0000");
          return await interaction.reply({ embeds: [notChannel], ephemeral: true });
        }
        // Pega o canal que foi enviado pelo slash command e remove da database e retorna uma mensagem de sucesso
        await database.activeMember.pull("channelsId", getChannelOption)
        const removeSuccess = new EmbedBuilder()
        .setDescription(`### <:remove:1212567045695213629> O canal <#${getChannelOption}>  foi removido com sucesso!`)
        .setColor("#ff0000")
        await interaction.reply({ embeds: [removeSuccess], ephemeral: true })
      }
    } else if (interaction.options.getSubcommand() === "channels") {
      const getChannelsDatabase = await database.activeMember.get('channelsId')
      let channelsId = ''

      // Verifica se a database tem algum valor ou se o Array criada nela esta vazio
      if (getChannelsDatabase === null || getChannelsDatabase.length === 0) {
        channelsId = '`Nenhum canal definido`'
      } else {
        // Percore todos os ID's do Array e armazena eles na variável channelsId passando com a formatação do Discord para mensionar canal
        getChannelsDatabase.forEach(channel => {
          channelsId += `<#${channel}> `
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('Canais registrados no banco de dados')
        .setDescription(`* Canais: ${channelsId}\n\n**Esses canais não contaram pontos para o Membro Ativo**`)
        .setColor('#ffffff')


      await interaction.reply({ embeds: [embed], ephemeral: true })
    }
  },
};