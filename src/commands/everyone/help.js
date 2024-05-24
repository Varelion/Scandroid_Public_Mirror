const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { SOME_BIOANDROID_COLOR, DEV_SERVER_URL } = require("../../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Replies with some help!')
		.addStringOption(option =>
			option
				.setName("help_topic")
				.setDescription("The topic you need help on")
				.setRequired(false)
		),

	async execute(guildService, interaction) {
		try {
			// Check if SOME_BIOANDROID_COLOR is properly defined and is a number
			const embedColor = typeof SOME_BIOANDROID_COLOR === 'number' ? SOME_BIOANDROID_COLOR : 0xFFFF00;

			const helpEmbed = new EmbedBuilder()
				.setTitle("Scandroid Step-By-Step Guide")
				.setColor(embedColor)
				.setURL('https://youtu.be/wfxDIyYU9nM') // Fallback URL
				.setDescription(
					"# __End-User:__\n" +
					"1. Use `/xp` to check their own XP\n" +
					"2. Use `/edit_character` to change your character's name or portrait\n" +
					"3. Use `/set` to change which character is gaining XP. For example, Kei's first character is Lumina, with an index number of 1, and Amica, with an index number of 2. To gain XP on Amica, she would use `/set 2`. To switch to Lumina, she would do `/set 1`. This is a **vital** step if you wish to have multiple characters on one Discord account. Staff will monitor to ensure everyone is doing this properly so that XP is awarded to the correct characters.\n" +
					"4. Go to `/xp`, then click the 'Retire' button twice to retire a character. This will ping staff and inform them what XP your character ended at so that they can do the proper retirement calculations\n\n" +
					"# __Staff:__\n" +
					'1. Use /approve_player to select a player and approve a character. Staff must set the player’s name for them initially, but they can change it after the fact.\n' +
					'2. Use /award_xp to change the XP of any player. If awarding a character xp and levels that would put them into a different tier, staff must remind the player to use the /set command afterwards so that tier roles update automatically\n' +
					'3. Use /xp to check the XP for any player\n' +
					'4. Use /edit_channel to set xp per post baselines for each channel (this would ideally be the same for each channel except for say, solo bubbles)\n' +
					'5. Use /edit_config to change the xp per post divisor used for the exponential calculation, the xp per post formula (we will keep this on exponential to reward longposting), as well as role modifiers'
				);

			await interaction.editReply({ embeds: [helpEmbed] });
		} catch (error) {
			console.error(error);
			await interaction.editReply("An error occurred while trying to display the help information. Please try again later.");
		}
	},
};
