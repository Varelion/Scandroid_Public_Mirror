const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit_roles')
        .setDescription('Adds / Removes Roles From Server Database! [ MOD ]')

        .addRoleOption(option => option
            .setName("role")
            .setDescription("A Role To Be Added / Removed")
            .setRequired(true))
        .addIntegerOption(option => option
            .setName("bonus")
			.setDescription("Multiplayer To Awarded XP ( negatives remove from database )")
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
		if (!guildService.isMod(interaction.member._roles) &&
			interaction.user.id != interaction.guild.ownerId && interaction.user.id != 410879158533619712 && interaction.user.id != 117703043520266240) {
			await interaction.editReply("Sorry, you do not have the right role to use this command.");
			return;
		}

        /*
        --------------
        INITIALIZE
        --------------
        */
        const role = interaction.options.getRole("role")
        const bonus = interaction.options.getInteger("bonus")

        await guildService.updateRole(role.id, bonus);

        await interaction.editReply("Success!");
    }
}
