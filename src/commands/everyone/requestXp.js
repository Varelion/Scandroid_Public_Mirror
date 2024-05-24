const { SlashCommandBuilder } = require('@discordjs/builders');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');


const { Some_BioAndroid_COLOR, Some_BioAndroid_ICON_URL, DEV_SERVER_URL, Some_BioAndroid_LEVEL_UP_COLOR, Some_BioAndroid_RETIRE_COLOR, Some_BioAndroid_APPROVE_COLOR } = require("../../config.json");
const { getLevelInfo, getProgressionBar, awardXPs } = require("../../utils")


module.exports = {
    data: new SlashCommandBuilder()
        .setName('request_xp')
        .setDescription('Rewards The Player With XP / CXP!')

        .addIntegerOption(option => option
            .setName("character")
            .setDescription("Which Character You Want To Approve ( 1 -> 10 )")
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(true))
        .addStringOption(option => option
            .setName("award_type")
            .setDescription("The Field That You Want To Manage Of A User")
            .addChoices(
                { name: "Set Level", value: "set_level" },
                { name: "Set XP", value: "set_xp" },
                { name: "Get XP", value: "give_xp" },
                { name: "Set CXP", value: "set_cxp" },
                { name: "Get CXP", value: "give_cxp" }
            )
            .setRequired(true))
        .addIntegerOption(option => option
            .setName("value")
            .setDescription("The Value For What Is Being Managed")
            .setRequired(true))
        .addStringOption(option => option
            .setName("memo")
            .setDescription("A Small Note On Why The Reward")
            .setRequired(false))

        .addBooleanOption(option => option
            .setName("public")
            .setDescription("Show This Command To Everyone?")
            .setRequired(false))
    ,
    async execute(guildService, interaction) {
        /*
        --------------
        INITIALIZE
        --------------
        */
        const characterId = interaction.options.getInteger("character");
        const awardType = interaction.options.getString("award_type");
        const value = interaction.options.getInteger("value");
        let memo = interaction.options.getString("memo");

        const guild = interaction.member.guild;
        const user = interaction.user;
        const player = await guild.members.fetch(user.id);

        let character = await guildService.getCharacter(`${player.id}-${characterId}`);
        let awardChannel;

        /*
        -------------
        VALIDATION X2
        -------------
        */
        try {
            awardChannel = await guild.channels.fetch(guildService.config["levelUpChannelId"]);
        } catch (error) {
            const owner = await guild.members.fetch(guild.ownerId);
            await interaction.editReply(`Sorry, but I can't find the **level_up_channel**.\nPlease contact ${owner} and ask them to set a new **level_up_channel** with : \`/edit_config\``);
            return;
        }

        if (!character) {
            await interaction.editReply("Sorry, but that character does not exist");
            return;
        }

        // some more inits
        const oldXp = character["xp"];
        const oldLevelInfo = getLevelInfo(guildService.levels, oldXp)

        /*
        ------------
        XP ALGORITHM
        ------------
        */
        switch (awardType) {
            case "set_level":
                let newXp = 0
                for (const [level, xp] of Object.entries(guildService.levels)) {
                    if (parseInt(level) < value) { newXp += xp; }
                }
                character["xp"] = newXp;
                break;
            case "set_xp":
                character["xp"] = value;
                break;
            case "give_xp":
                character["xp"] += value;
                break;
            case "set_cxp":
				character["xp"] = awardXPs(0, value, guildService.levels);
                break;
            case "give_cxp":
				character["xp"] = awardXPs(character["xp"], value, guildService.levels);
                break;
        }

        /*
        -------------
        AWARD XP POST
        -------------
        */
        // useful inits
        const newXp = character["xp"];
        const newLevelInfo = getLevelInfo(guildService.levels, newXp);
        const progressBar = getProgressionBar(newLevelInfo["levelXp"], newLevelInfo["xpToNext"]);

        // giving useful information
        if (!memo){
            memo = `Command Requested In <#${interaction.channelId}>`
        }

        // embed inits
        let awardEmbed = new EmbedBuilder()
            .setDescription(memo)
            .setFooter({ text: `Like the bot? Click the title to visit the dev server!` })
			.setThumbnail((character["picture_url"] != "" && character["picture_url"] !== "null") ? character["picture_url"] : Some_BioAndroid_ICON_URL)
            .setURL(DEV_SERVER_URL)

        let levelFieldName = "Level";
        let levelFieldValue = newLevelInfo["level"];
        // determining if the player is a different level than before
        if (oldLevelInfo["level"] != newLevelInfo["level"]) {
            levelFieldName = "Level Up!";
            levelFieldValue = `${oldLevelInfo["level"]} --> **${newLevelInfo["level"]}**`;
			awardEmbed.setColor(Some_BioAndroid_LEVEL_UP_COLOR);
		} else { awardEmbed.setColor(Some_BioAndroid_COLOR); }

        switch (awardType) {
            case "set_level":
                awardEmbed.setTitle(`${character["name"]}'s Level Request`)
                awardEmbed.setFields(
                    { inline: true, name: "Level", value: newLevelInfo["level"] },
                    { inline: true, name: "Requested By", value: `${interaction.user}` }
                )
                break;
            case "set_xp":
                awardEmbed.setTitle(`${character["name"]}'s XP Set Request`)
                awardEmbed.setFields(
                    { inline: true, name: "Level", value: newLevelInfo["level"] },
                    { inline: true, name: "Total XP", value: `${value}` },
                    { inline: true, name: "Requested By", value: `${interaction.user}` },
                    { inline: false, name: "Progress", value: progressBar },
                )
                break;
            case "give_xp":
                awardEmbed.setTitle(`${character["name"]}'s XP Request`)
                awardEmbed.setFields(
                    { inline: true, name: levelFieldName, value: levelFieldValue },
					{ inline: true, name: "XP Received", value: `${value}` },
                    { inline: true, name: "Requested By", value: `${interaction.user}` },
                    { inline: false, name: "Progress", value: progressBar },
                )
                break;
            case "set_cxp":
                awardEmbed.setTitle(`${character["name"]}'s CXP Set Request`)
                awardEmbed.setFields(
                    { inline: true, name: "Level", value: newLevelInfo["level"] },
                    { inline: true, name: "Total CXP", value: `${value}` },
                    { inline: true, name: "Requested By", value: `${interaction.user}` },
                    { inline: false, name: "Progress", value: progressBar },
                )
                break;
            case "give_cxp":
                awardEmbed.setTitle(`${character["name"]}'s CXP Request`)
                awardEmbed.setFields(
                    { inline: true, name: levelFieldName, value: levelFieldValue },
					{ inline: true, name: "Character XP Received", value: `${value}` },
                    { inline: true, name: "Requested By", value: `${interaction.user}` },
                    { inline: false, name: "Progress", value: progressBar },
                )
                break;
        };

        /*
        ---------------
        POSTING REQUEST
        ---------------
        */
        if (guildService.config["allowPlayerManageXp"] == "on") {
            await awardChannel.send({ content: `${player} <@&${guildService.config["moderationRoleId"]}>`, embeds: [awardEmbed] });
            /*
            ----------------
            UPDATE CHARACTER
            ----------------
            character - schema :
                character_id   : STRING
                character_index: NUMBER
                name           : STRING
                sheet_url      : STRING
                picture_url    : STRING
                player_id      : STRING
                xp             : NUMBER
            */
            const characterSchema = {
                "character_id": character["character_id"],
                "character_index": character["character_index"],
                "player_id": character["player_id"],
                "xp": character["xp"],
            };

            await guildService.setCharacterXP(characterSchema);
        } else {
            const requestButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('request_approve')
                        .setLabel('Approve')
                        .setStyle("Success"),
                    new ButtonBuilder()
                        .setCustomId("request_reject")
                        .setLabel("Reject")
                        .setStyle("Danger")
                );

            //  content: `${player} <@&${guildService.config["moderationRoleId"]}>`,
            const requestMessage = await awardChannel.send({ embeds: [awardEmbed], components: [requestButtons] });
            createButtonEvents(guildService, requestMessage, character, (newXp - oldXp), awardChannel, awardEmbed, player)
        }

        await interaction.editReply("Success!");
    },
};

function createButtonEvents(guildService, requestMessage, character, deltaXp, collectorChannel, awardEmbed, player) {
    /*
    ------------------
    CREATING COLLECTOR
    ------------------
    */
    const filter = btnInteraction => (
        ['request_approve', 'request_reject'].includes(btnInteraction.customId) &&
        requestMessage.id == btnInteraction.message.id &&
        (
            btnInteraction.member._roles.includes(guildService.config["moderationRoleId"]) ||
            btnInteraction.member.id == btnInteraction.member.guild.ownerId
        )

    );
    if (!collectorChannel) { return; }
    const collector = collectorChannel.createMessageComponentCollector({ filter, time: 86_400_000 });

    collector.on('collect', async btnInteraction => {
        try {
            switch (btnInteraction.customId) {
                case "request_approve":
                    awardEmbed.addFields({ inline: false, name: "Approved By", value: `${btnInteraction.user}` })
					awardEmbed.setColor(Some_BioAndroid_APPROVE_COLOR)

                    await guildService.updateCharacterXP(character, deltaXp);

                    await btnInteraction.update({ embeds: [awardEmbed], components: [] });
                    await player.send({ embeds: [awardEmbed]});
                    break;
                case "request_reject":
                    awardEmbed.addFields({ inline: false, name: "Rejected By", value: `${btnInteraction.user}` })
					awardEmbed.setColor(Some_BioAndroid_RETIRE_COLOR)
                    await btnInteraction.update({ embeds: [awardEmbed], components: [] });
                    await player.send({ embeds: [awardEmbed]});
                    break;
            }
            return;
        } catch (error) { console.log(error) }
    });
}
