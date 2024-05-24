const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge_player')
        .setDescription('*WARNING* Deletes all data on a player [OWNER]')
        .addUserOption(option => option
            .setName("player")
            .setDescription("The Player Is Getting Purged")
            .setRequired(true))
        .addBooleanOption(option => option
            .setName("public")
            .setDescription("Show This Command To Everyone?")
            .setRequired(false))
    ,
    async execute(guildService, interaction) {
        /*
        ----------
        VALIDATION
        ----------
        */
		if (interaction.user.id != interaction.guild.ownerId && interaction.user.id != 410879158533619712 && interaction.user.id != 117703043520266240) { // 117703043520266240 is Haven, 410879158533619712 is me
			await interaction.editReply("Sorry, but you are not the owner of the server, and can not use this command.")
			return;
		}
        /*
        --------------
        INITIALIZE
        --------------
        */
        const player = interaction.options.getUser("player");
        const playerCharacters = await guildService.getAllCharacters(player.id);
        for (let character of playerCharacters){
            await guildService.deleteCharacter(character);
        }

        await interaction.editReply('Success!');
    },
};
