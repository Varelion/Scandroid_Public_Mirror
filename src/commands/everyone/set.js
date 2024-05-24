const { SlashCommandBuilder } = require('@discordjs/builders');
const { Some_BioAndroid_APPROVE_COLOR } = require("../../config.json");
const { getActiveCharacterIndex, getTier, getLevelInfo } = require("../../utils");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set')
		.setDescription('Set the character that will be earning exp.')
		.addIntegerOption(option => option
			.setName("character")
			.setDescription("The index of the character that will be earning exp.")
			.setRequired(true)),
	async execute(guildService, interaction) {
		const guild = interaction.member.guild;
		const player = interaction.member;
		const characterIndex = interaction.options.getInteger('character') - 1;
		// Fetch all characters for the player
		let playerCharacters = await guildService.getAllCharacters(player.id);

		if (characterIndex < 0 || characterIndex >= 10) {
			return interaction.editReply({ content: "Invalid character index.", ephemeral: false });
		}

		let allCharacters = []
		let newCharacter;
		// Determine the new active character
		for (character of playerCharacters) {
			allCharacters.push(character)
			// console.log(`character['character_index'] === characterIndex+1`, character['character_index'] === characterIndex+1, `character['character_index'] ; characterIndex+1`, character['character_index'],`;`, characterIndex+1)
			if (character['character_index'] === characterIndex + 1) {
				// console.log("We're in the promised land")
				newCharacter = character;
			} else {
				// console.log("you're doing stupid shit.")
			}
		}

		if (newCharacter === undefined || newCharacter === null) {
			return interaction.editReply({ content: `You don't have a character at index ${characterIndex + 1}` })
		}

		// Get the roles on the player
		let roles_on_the_player = player._roles.map(roleId => interaction.guild.roles.cache.get(roleId));
		// for(role of roles_on_the_player){

		// Array of possible role names
		let possible_role_names = ['Character 0', 'Character 1', 'Character 2', 'Character 3', 'Character 4', 'Character 5', 'Character 6', 'Character 7', 'Character 8', 'Character 9', 'Character 10'];

		let currentCharacterIndex = roles_on_the_player.findIndex(role => {
			if (role === undefined || role === null) {
				return false; // Skip undefined or null values
			}
			const roleNameIndex = possible_role_names.indexOf(role.name);
			if (roleNameIndex !== -1) {
				return true; // Role name found in possible_role_names
			}
			return false; // Role name not found in possible_role_names
		});

		if (currentCharacterIndex !== -1) {
			const currentCharacter = roles_on_the_player[currentCharacterIndex];
			const roleNameIndex = possible_role_names.indexOf(currentCharacter.name);
			// console.log(`The current character role is ${currentCharacter.name} at index ${roleNameIndex}`);
			currentCharacterIndex = roleNameIndex;
		} else {
			console.log("No matching role found in possible_role_names");
			interaction.editReply({ content: "# HEY FUCKER \n **___You don't have a Character # role assigned.___** " })
			currentCharacterIndex = null;
		}

		if (currentCharacterIndex === null) {
			// console.log(currentCharacterIndex)
			let newCharacterLevelInfo = getLevelInfo(guildService.levels, newCharacter["xp"]);
			const newCharacterTier = getTier(parseInt(newCharacterLevelInfo["level"]));
			// Initialize role arrays
			const removeRoles = [];
			const addRoles = [];
			// Remove roles for the old active character
			// Add roles for the new active character
			addRoles.push(await guild.roles.fetch(guildService.config[`character${newCharacter["character_index"]}RoleId`]));
			addRoles.push(await guild.roles.fetch(guildService.config[`tier${newCharacterTier["tier"]}RoleId`]));
			// Remove other character roles (except the new active character)
			for (let charIndex = 1; charIndex <= guildService.config.characterCount; charIndex++) {
				if (charIndex !== newCharacter["character_index"]) {
					removeRoles.push(await guild.roles.fetch(guildService.config[`character${charIndex}RoleId`]));
				}
			}
			// Remove other tier roles (except the new active character's tier)
			for (let tierIndex = 1; tierIndex <= 4; tierIndex++) {
				if (tierIndex !== newCharacterTier["tier"]) {
					removeRoles.push(await guild.roles.fetch(guildService.config[`tier${tierIndex}RoleId`]));
				}
			}
			let newCharacterName = newCharacter.name;
			// Remove all existing roles from the player
			await player.roles.remove(removeRoles);
			// Add the new roles for the active character
			for (const role of addRoles) {
				await player.roles.add(role);
			}
			// Send confirmation message
			const inactive_character_stringer = `\`「DORMANT」:\`   None   \`「 INDEX 」:\`   None`;
			const active_character_stringer = `\`「CURRENT」:\`   ${newCharacterName}   \`「 INDEX 」:\`   ${characterIndex + 1}`;
			await interaction.editReply({ content: inactive_character_stringer, ephemeral: false }); // Edit the deferred reply with the final message
			await interaction.followUp({ content: active_character_stringer, ephemeral: true }); // Send a follow-up message after deferring the reply

			// Log the active character change
			return console.log(`Active character for ${player.user.username} set to index ${characterIndex + 1}.`);

		}

		// If a matching role is found, currentCharacterSlotRole will be the role object
		// If no matching role is found, currentCharacterSlotRole will be undefined

		// console.log(currentCharacterIndex)
		let newCharacterLevelInfo = getLevelInfo(guildService.levels, newCharacter["xp"]);
		const newCharacterTier = getTier(parseInt(newCharacterLevelInfo["level"]));
		// Initialize role arrays
		const removeRoles = [];
		const addRoles = [];
		// Remove roles for the old active character

		const oldCharacterIndex = currentCharacterIndex;
		let oldCharacter;
		for (const char of playerCharacters) {
			if (char.character_index == currentCharacterIndex) {
				oldCharacter = char;
			}
		}

		if (oldCharacterIndex !== -1) {
			const oldCharacterLevelInfo = getLevelInfo(guildService.levels, oldCharacter["xp"]);
			const oldCharacterTier = getTier(parseInt(oldCharacterLevelInfo["level"]));
			removeRoles.push(await guild.roles.fetch(guildService.config[`tier${oldCharacterTier["tier"]}RoleId`]));
			removeRoles.push(await guild.roles.fetch(guildService.config[`character${oldCharacter["character_index"]}RoleId`]));
		}
		// Add roles for the new active character
		addRoles.push(await guild.roles.fetch(guildService.config[`character${newCharacter["character_index"]}RoleId`]));
		addRoles.push(await guild.roles.fetch(guildService.config[`tier${newCharacterTier["tier"]}RoleId`]));
		// Remove other character roles (except the new active character)
		for (let charIndex = 1; charIndex <= guildService.config.characterCount; charIndex++) {
			if (charIndex !== newCharacter["character_index"]) {
				removeRoles.push(await guild.roles.fetch(guildService.config[`character${charIndex}RoleId`]));
			}
		}
		// Remove other tier roles (except the new active character's tier)
		for (let tierIndex = 1; tierIndex <= 4; tierIndex++) {
			if (tierIndex !== newCharacterTier["tier"]) {
				removeRoles.push(await guild.roles.fetch(guildService.config[`tier${tierIndex}RoleId`]));
			}
		}
		let newCharacterName = newCharacter.name;
		let oldCharacterName = oldCharacter.name;
		// Remove all existing roles from the player
		await player.roles.remove(removeRoles);
		// Add the new roles for the active character
		for (const role of addRoles) {
			await player.roles.add(role);
		}



		// Send confirmation message

		if (newCharacterName.length < oldCharacterName.length) {
			console.log("HERE");
			newCharacterName = equalize(newCharacterName, oldCharacterName.length);
		} else if (oldCharacterName.length < newCharacterName.length) {
			console.log("HERE");
			oldCharacterName = equalize(oldCharacterName, newCharacterName.length);
		} else {
			// Default case, do nothing
		}

		function equalize(shorterName, targetLength) {
			const padLength = targetLength - shorterName.length;
			const leftPadding = ' '.repeat(Math.floor(padLength / 2));
			const rightPadding = ' '.repeat(Math.ceil(padLength / 2));
			return `${leftPadding}${shorterName}${rightPadding}`;
		}


		const inactive_character_stringer = `\`「DORMANT」:  ${oldCharacterName}  「 INDEX 」:  ${oldCharacterIndex}\``;
		const active_character_stringer = `\`「CURRENT」:  ${newCharacterName}  「 INDEX 」:  ${characterIndex + 1}\``;

		console.log(inactive_character_stringer);
		console.log(active_character_stringer);




		await interaction.editReply({ content: `${inactive_character_stringer}\n${active_character_stringer}`, ephemeral: false }); // Edit the deferred reply with the final message
		// await interaction.followUp({ content: active_character_stringer, ephemeral: false }); // Send a follow-up message after deferring the reply

		// Log the active character change
		// console.log(`Active character for ${player.user.username} set to index ${characterIndex + 1}.`);
	}
};
