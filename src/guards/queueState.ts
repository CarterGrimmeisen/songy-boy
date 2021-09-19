import { CommandInteraction } from 'discord.js'
import { GuardFunction } from 'discordx'

import { distube } from '..'

export const isPlayingGuard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    if (distube.getQueue(interaction.guildId!)?.playing) {
        return next()
    }

    return interaction.reply({ content: "I'm not playing anything right now.", ephemeral: true })
}

export const isPausedGuard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    if (distube.getQueue(interaction.guildId!)?.paused) {
        return next()
    }

    return interaction.reply({ content: 'Nothing is paused anything right now.', ephemeral: true })
}
