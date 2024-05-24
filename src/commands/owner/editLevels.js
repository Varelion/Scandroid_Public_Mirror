const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit_levels')
        .setDescription('Changes XP Needed To Level Up In Server Database! [ OWNER ]')

        .addIntegerOption(option => option
            .setName("level")
            .setDescription("A Level To Be Edited")
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(true))
        .addIntegerOption(option => option
            .setName("xp_to_next")
            .setDescription("Amount Of XP Required To Level Up")
            .setMinValue(0)
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
        const level = interaction.options.getInteger("level")
        const xpToNext = interaction.options.getInteger("xp_to_next")

        await guildService.updateLevel(level, xpToNext);

        await interaction.editReply("Success!");
    }
}
