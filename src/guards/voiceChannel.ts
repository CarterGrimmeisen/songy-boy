import { GuardFunction } from 'discordx'

import { getInteractionInfo, HandledInteraction } from '../util'

export const inVoiceChannelGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (channel) return next()

    return interaction.reply({
        content: 'You need to be in a voice channel to use this command',
        ephemeral: true,
    })
}

export const fullVoiceChannelGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (!channel?.full || interaction.guild?.me?.permissions.has('MOVE_MEMBERS')) return next()

    return interaction.reply({
        content: 'I cannot join a full voice channel to play music.',
        ephemeral: true,
    })
}

export const inAnotherChannelGuard: GuardFunction<HandledInteraction> = async (interaction, _, next) => {
    const [, channel] = await getInteractionInfo(interaction)
    if (!interaction.guild?.me?.voice.channelId || channel?.id === interaction.guild?.me?.voice.channelId) return next()

    return interaction.reply({
        content: 'I am already playing music in a different channel, join that one and try again.',
        ephemeral: true,
    })
}

export const voiceChannelGuards = [inVoiceChannelGuard, fullVoiceChannelGuard, inAnotherChannelGuard]
