import { CommandInteraction, GuildMember } from 'discord.js'
import { GuardFunction } from 'discordx'

import { getInteractionInfo } from '../util'

export const inVoiceChannelGuard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (!channel)
        return interaction.reply({
            content: 'You need to be in a voice channel to use this command',
            ephemeral: true,
        })

    next()
}

export const fullVoiceChannelGuard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (channel?.full && interaction.guild?.me?.permissions.has('MOVE_MEMBERS') !== true)
        return interaction.reply({
            content: 'I cannot join a full voice channel to play music.',
            ephemeral: true,
        })

    next()
}

export const inAnotherChannelGuard: GuardFunction<CommandInteraction> = async (interaction, client, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (interaction.guild?.me?.voice.channelId && channel?.id !== interaction.guild?.me?.voice.channelId)
        return interaction.reply({
            content: 'I am already playing music in a different channel, join that one and try again.',
            ephemeral: true,
        })

    next()
}

export default [inVoiceChannelGuard, fullVoiceChannelGuard, inAnotherChannelGuard]
