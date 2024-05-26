const dotenv = require('dotenv');
const fs = require('fs');

const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, InteractionType, ChannelType, CommandInteractionOptionResolver, GuildMember } = require('discord.js');
const sqlite3 = require("sqlite3");

const { guildService } = require("./src/services/guild");
const { sqlLite3DatabaseService } = require("./src/database/sqlite");

const { getActiveCharacterIndex, getXp, getRoleMultiplier, getLevelInfo, getTier, logCommand, logError } = require("./src/utils");
const { Some_BioAndroid_COLOR, Some_BioAndroid_ICON_URL, CLIENT_ID } = require("./src/config.json")



/*
-----------------------
LOADING ENV VARS (.env)
-----------------------
*/
dotenv.config();
/*
---------------------------
LOADING DISCORD PERMISSIONS
---------------------------
*/
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages],
	partials: [Partials.Channel]
});
client.commands = new Collection();
/*
----------------
LOADING COMMANDS
----------------
*/
const commandsPath = [
	"everyone",
	"mod",
	"owner",
];
for (const path of commandsPath) {
	const commandCollection = fs.readdirSync(`./src/commands/${path}`).filter(file => file.endsWith('.js'));
	for (const file of commandCollection) {
		const command = require(`./src/commands/${path}/${file}`);
		client.commands.set(command.data.name, command);
	}
}

/*
------------
BOT COMMANDS
------------
*/
client.once('ready', () => {
	//clearGuildCache();
	console.log("ready");
});


const POSSIBILITIES = [
	".set1",
	".set2",
	".set3",
	".set4",
	".set5",
	".set6",
	".set7",
	".set8",
	".set9",
	".set10",
];


function parsing(message) {
	// Remove spaces and convert to lowercase
	// console.log(message)
	const x = message.content.replace(/\s+/g, '').toLowerCase();
	console.log(x);

	// Check if x is not an empty string and is included in POSSIBILITIES
	if (x !== '' && POSSIBILITIES.includes(x)) {
		const index = POSSIBILITIES.indexOf(x);
		console.log("Here at index:", index);

		executeInteraction(index, message);
	}
}

async function executeInteraction(index, message) {
	try {
		const gService = new guildService(
			await new sqlLite3DatabaseService(sqlite3, `./guilds/${message.guildId}.db`)
		)
		await gService.init();
		if (!await gService.isRegistered() && command.data.name != "register") {
			// Try Catch on the reply, because this is a restful call, and errors can be found
			try {
				await interaction.editReply({
					content: `Sorry, but your server is not registered, please contact <@${interaction.guild.ownerId}> and ask them todo \`/register\`.`,
					ephemeral: true
				});
			} catch (error) { };
			return;
		}

		let interaction = {
			type: InteractionType.ApplicationCommand,
			commandName: 'set',
			client,
			member: await message.guild.members.fetch(message.author.id),
			user: message.author,
			guildId: message.guildId,
			applicationId: CLIENT_ID,
			channelId: message.channelId,
			guild: message.guild,
			options: new CommandInteractionOptionResolver(client, [
				{
					name: 'character',
					type: 4, // INTEGER option type
					value: index + 1, // Convert index to 1-based indexing
				},
			]),
		};


		// Emit the interactionCreate event with the simulated interaction data
		// client.emit('interactionCreate', interaction);
		const command = client.commands.get(interaction.commandName);
		await command.execute(gService, interaction);
	} catch (error) {
		console.log(error);
	}
}


client.on('interactionCreate', async interaction => {
	/*
	-------------------------------------
	VALIDATIONS FOR INTERACTION EXECUTION
	-------------------------------------
	*/
	if (!interaction.isCommand() ||
		!interaction.inGuild()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	const guildId = `${interaction.guildId}`;

	// LOADING GUILD SERVICE
	const gService = new guildService(
		await new sqlLite3DatabaseService(sqlite3, `./guilds/${guildId}.db`)
	)
	await gService.init();
	if (!await gService.isRegistered() && command.data.name != "register") {
		// Try Catch on the reply, because this is a restful call, and errors can be found
		try {
			await interaction.editReply({
				content: `Sorry, but your server is not registered, please contact <@${interaction.guild.ownerId}> and ask them todo \`/register\`.`,
				ephemeral: true
			});
		} catch (error) { };
		return;
	}
	/*
	-----------------
	EXECUTING COMMAND
	-----------------
	*/
	try {
		logCommand(interaction);
	} catch (error) {
		console.log(error);
	}
	try {
		let is_public = !interaction.options.getBoolean("public");
		await interaction.deferReply({ ephemeral: is_public });
		await command.execute(gService, interaction);
	} catch (error) {
		try {
			logError(interaction, error);
		} catch (error) {
			console.log(error);
		}
		console.log(error);
	}
});

/*
-----------
XP PER POST
-----------
*/
client.on('messageCreate', async message => {
	try {

		parsing(message);

		let IS_COMBAT = false;

		/*
		----------
		VALIDATION
		----------
		*/
		if (message.content[0] == '>' && message.content[1] != ' '){
			console.log(message.channelId)
		}
		if (message.content[0] == '>' && message.content[1] != ' ' && message.channelId == 1242965566495522856) {
			return message.channel.send({ content: "AWAKEN MY MASTER" })

		}


		if (!message.inGuild()) { return; }
		if (message.author.bot) { return; }
		if ((message.content.split(/\s+/).length <= 10) && !message.content.startsWith('!')) { return; }
		if ((message.content.length < 2) && message.content.startsWith('!')) { return; } // if has ! at start, length needs to be bigger than 2
		if (message.content.startsWith('!')) { IS_COMBAT = true }





		// if (!message.content.startsWith('!')) { IS_COMBAT = false }
		/*
		--------------------------------
		LOADING GUILD INTO CACHED GUILDS
		--------------------------------
		*/
		const guildId = `${message.guildId}`;
		if (!fs.existsSync(`./guilds/${guildId}.db`)) {
			return;
		}

		const gService = new guildService(
			await new sqlLite3DatabaseService(sqlite3, `./guilds/${guildId}.db`)
		)
		await gService.init();
		if (!await gService.isRegistered()) { return; }
		/*
		--------------
		INITIALIZE
		--------------
		*/
		const messageCount = message.content.split(/\s+/).length;
		const guild = await client.guilds.fetch(guildId);

		const player = await guild.members.fetch(message.author.id);
		const roleBonus = getRoleMultiplier(gService.config["roleBonus"], gService.roles, player._roles);

		const characterIndex = getActiveCharacterIndex(gService.config, player._roles);
		const character = await gService.getCharacter(`${player.id}-${characterIndex}`)
		if (!character) { return; }

		// --------------------------
		//#region Channel check
		// --------------------------
		let channel = await guild.channels.fetch(message.channelId);

		while (channel) {
			if (channel.id in gService.channels) { break; }
			channel = await guild.channels.fetch(channel.parentId);
		}
		if (!channel) { return; }

		if (gService.channels[channel.id] == 0) { return; }
		//#end region Channel check


		// --------------------------
		//#region EXP / XP Calculations
		// --------------------------
		const xp = getXp(messageCount, roleBonus, gService.channels[channel.id], gService.config["xpPerPostDivisor"], gService.config["xpPerPostFormula"], IS_COMBAT);
		//#end region EXP / XP Calculations

		if (player._roles.includes(gService.config["xpShareRoleId"])) {
			const playerCharacters = await gService.getAllCharacters(player.id);
			for (let subCharacter of playerCharacters) {
				await updateCharacterXpAndMessage(guild, gService, subCharacter, xp / playerCharacters.length, player)
			}
		} else {
			await updateCharacterXpAndMessage(guild, gService, character, xp, player)
		}


	} catch (error) { console.log(error); }
});

async function updateCharacterXpAndMessage(guild, gService, character, xp, player) {
	try {
		await gService.updateCharacterXP(character, xp);

		const oldLevelInfo = getLevelInfo(gService.levels, character["xp"]);
		const newLevelInfo = getLevelInfo(gService.levels, character["xp"] + xp);

		if (oldLevelInfo["level"] != newLevelInfo["level"]) {
			const newTier = getTier(newLevelInfo["level"]);

			const tierRoles = []
			for (let tierIndex = 1; tierIndex <= 4; tierIndex++) {
				if (tierIndex == newTier["tier"]) { continue; }
				tierRoles.push(await guild.roles.fetch(gService.config[`tier${tierIndex}RoleId`]));
			}

			const newTierRole = await guild.roles.fetch(gService.config[`tier${newTier["tier"]}RoleId`]);

			try {
				const updatedPlayer = await player.roles.remove(tierRoles);
				await updatedPlayer.roles.add(newTierRole);
			} catch (error) {
				console.log(error);
			}


			let awardChannel;
			try {
				awardChannel = await guild.channels.fetch(gService.config["levelUpChannelId"]);
			} catch (error) { return; }

			let levelUpEmbed = new EmbedBuilder()
				.setTitle(`${character["name"]} Leveled Up`)
				.setFields(
					{ name: "Level Up!", value: `${oldLevelInfo["level"]} --> **${newLevelInfo["level"]}**`, inline: true },
					{ name: "Total Character XP", value: `${Math.floor(character["xp"] + xp)}`, inline: true },
					{ name: "Tier", value: `<@&${gService.config[`tier${newTier["tier"]}RoleId`]}>`, inline: true }
				)
				.setThumbnail((character["picture_url"] != "" && character["picture_url"] !== "null") ? character["picture_url"] : Some_BioAndroid_ICON_URL)
				.setColor(Some_BioAndroid_COLOR)
				.setFooter({ text: "You can view your characters with /xp" })

			if (character["sheet_url"] != "") {
				levelUpEmbed.setURL(character["sheet_url"]);
			}

			awardChannel.send({ content: `${player}`, embeds: [levelUpEmbed] });
		}
	} catch (error) { console.log(error) }
}

/*
---------------------
LOGGING THE BOT ONLINE
---------------------
*/
client.login(process.env.DISCORD_TOKEN);
