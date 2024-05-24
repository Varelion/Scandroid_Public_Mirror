const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');

// Function to read the configuration file
function readConfig() {
	try {
		const data = fs.readFileSync('src/config.json', 'utf8');
		return JSON.parse(data);
	} catch (err) {
		console.error('Error reading config file:', err);
		return null;
	}
}

// Function to write the configuration file
async function writeConfig(newCombatMultiplier) {
	try {
		// Read the existing config
		const existingConfig = readConfig();
		if (!existingConfig) {
			console.error('Unable to read existing config.');
			return;
		}

		// Update the COMBAT_MULTIPLIER property
		existingConfig.COMBAT_MULTIPLIER = newCombatMultiplier;

		// Write the updated config back to the file
		fs.writeFileSync('src/config.json', JSON.stringify(existingConfig, null, 4));
		console.log('Config file updated successfully.');
	} catch (err) {
		console.error('Error writing config file:', err);
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit_combat_multiplier')
		.setDescription('Change the combat multiplier to something else.')
		.addNumberOption(option =>
			option
				.setName("new_combat_multiplier")
				.setDescription("Enter desired combat multiplier.")
				.setMinValue(0)
				.setMaxValue(10)
				.setRequired(true)
		),
	async execute(guildService, interaction) {
		/*
		----------
		VALIDATION
		----------
		*/
		if (interaction.user.id !== interaction.guild.ownerId &&
			interaction.user.id !== '410879158533619712' &&
			interaction.user.id !== '117703043520266240') {
			await interaction.editReply("Sorry, but you are not the owner of the server and cannot use this command.");
			return;
		}

		/*
		--------------
		INITIALIZATIONS
		--------------
		*/
		let config = readConfig();
		if (!config) {
			// If config doesn't exist, create a new one
			config = { COMBAT_MULTIPLIER: 1 }; // Default value
		}

		const OLD_MULTIPLIER = config.COMBAT_MULTIPLIER;
		const NEW_MULTIPLIER = interaction.options.getNumber('new_combat_multiplier');

		writeConfig(NEW_MULTIPLIER); // Update the config file

		await interaction.editReply(`The old combat multiplier was ${OLD_MULTIPLIER}, and it is now ${NEW_MULTIPLIER}.`);
	},
};
