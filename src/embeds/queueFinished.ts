import { MessageEmbed, StageChannel, VoiceChannel } from 'discord.js'

export const queueFinishedEmbed = (voiceChannel: VoiceChannel | StageChannel) =>
    new MessageEmbed({
        description: `Finished playing music in <#${voiceChannel.id}>`,
        author: {
            name: 'Songy Boy',
            iconURL: 'https://cdn.discordapp.com/attachments/889316828625641512/889316862737924116/3dgifmaker34035.gif',
        },
    })
