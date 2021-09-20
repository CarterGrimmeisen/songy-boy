import { GuardFunction } from 'discordx'

import { distube } from '..'
import { HandledInteraction } from '../util'

export const isPlayingGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    if (distube.getQueue(interaction.guildId!)?.playing) {
        return next()
    }

    return interaction.reply({ content: "I'm not playing anything right now.", ephemeral: true })
}

export const isPausedGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    if (distube.getQueue(interaction.guildId!)?.paused) {
        return next()
    }

    return interaction.reply({ content: 'Nothing is paused anything right now.', ephemeral: true })
}

export const canSkipGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    if ((distube.getQueue(interaction.guildId!)?.songs.length ?? 0) > 1) {
        return next()
    }

    return interaction.reply({
        content: "There's nothing to skip to, add something to queue and try again.",
        ephemeral: true,
    })
}
