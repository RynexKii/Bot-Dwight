const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

// prettier-ignore
module.exports = {
  data: new SlashCommandBuilder()
  .setName("dead-by-daylight")
  .setDescription("Aqui estão alguns comandos úteis que podem facilitar o seu trabalho")
  .addSubcommand(subcommand =>
    subcommand
    .setName("pc-error")
    .setDescription("Explore potenciais resoluções para problemas no Dead by Daylight no PC.")),
  
  async execute(interaction) {
    const errorEmbed = new EmbedBuilder()
      .setTitle("Algumas possíveis correções de erros e bugs")
      .setDescription("* Nossa comunidade não está diretamente associada ao Dead by Daylight, portanto, pode ser que não tenhamos todas as soluções disponíveis. Se os passos fornecidos não resolverem seu problema, recomendamos entrar em contato diretamente com o suporte do Dead by Daylight para obter assistência adicional. Esperamos que consiga resolver seu problema com sucesso ")
      .addFields(
        { name: "Atualizações e Patches", value: "* Certifique-se de que o seu Dead by Daylight e todos os drivers do seu sistema estejam atualizados. Os desenvolvedores lançam correções regularmente para resolver problemas conhecidos e melhorar a estabilidade.", },
        { name: "Verificação de Integridade dos Arquivos", value: "* Steam e a Epic Games oferecem a opção de verificar a integridade dos arquivos do jogo. Isso pode corrigir erros causados por arquivos corrompidos ou ausentes." },
        { name: "Drivers de Hardware", value: "* Mantenha os drivers da sua placa de vídeo, processador e outros componentes atualizados. Drivers desatualizados podem resultar em problemas de desempenho e estabilidade." },
        { name: "Configurações Gráficas", value: "* Ajuste as configurações gráficas do jogo. Reduzir a qualidade gráfica pode aliviar a carga no sistema e resolver problemas de desempenho." },
        { name: "Reinstalação do Jogo", value: "* Em casos mais graves, recomendamos você a reinstalar o jogo completamente." },
        { name: "Fórum", value: "* Consulte o fórum da comunidade do jogo. Muitas vezes, outros jogadores já enfrentaram e resolveram problemas semelhantes." },
        { name: "Suporte Técnico", value: "* Por fim entre em contato com o suporte técnico do Dead by Daylight. Eles porem fornecer mais assistência personalizada e soluções específicas para o seu problema." }
        );
    await interaction.reply({ embeds: [errorEmbed] });
  },
};
