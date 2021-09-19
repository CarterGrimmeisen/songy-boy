import { MessageEmbed, StageChannel, VoiceChannel } from 'discord.js'

export const queueFinishedEmbed = (voiceChannel: VoiceChannel | StageChannel) =>
    new MessageEmbed({
        title: 'Queue Finished',
        description: `Finished playing music in "${voiceChannel.name}".`,
    })
