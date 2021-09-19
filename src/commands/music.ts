import { ButtonInteraction, CommandInteraction, Message, MessageActionRow } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashOption } from 'discordx'
import { Queue, Song } from 'distube'

import { distube } from '..'
import { pauseButton, playButton, skipButton, stopButton } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionEmbed } from '../embeds/simpleActionEmbed'
import { isPausedGuard, isPlayingGuard } from '../guards/queueState'
import voiceChannelGuards from '../guards/voiceChannel'
import { getInteractionInfo } from '../util'

@Discord()
export class Music {
    private message: Message | null = null

    @Slash('play', { description: 'Play a song either via search terms or url' })
    @Guard(...voiceChannelGuards)
    async play(
        @SlashOption('query', { required: true, description: 'The search terms or URL to play' })
        query: string,
        interaction: CommandInteraction,
    ) {
        const [member, voiceChannel] = await getInteractionInfo(interaction)
        distube.playVoiceChannel(voiceChannel!, query, { member })
        interaction.deferReply({ fetchReply: true }).then((message) => {
            if (message instanceof Message) this.message = message
        })

        const updatePlayingSong = (queue: Queue, song: Song) => {
            distube.once('finish', (queue) => {
                if (queue.voiceChannel?.id === voiceChannel?.id) {
                    distube.off('playSong', updatePlayingSong)
                    this.message?.edit({
                        embeds: [queueFinishedEmbed(voiceChannel!)],
                    })
                }
            })

            if (queue.voiceChannel?.guildId !== voiceChannel?.guildId) return
            if (queue.songs.length === 1) {
                interaction.followUp({
                    content: null,
                    embeds: [nowPlayingEmbed(member, song)],
                    components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
                })
            } else {
                interaction.followUp({
                    content: null,
                    embeds: [simpleActionEmbed(`Added ${song.name} to the queue.`, member, song.thumbnail)],
                })
            }
        }
        distube.on('playSong', updatePlayingSong)
    }

    @Slash('pause', { description: 'Pause the current song.' })
    @ButtonComponent('pause_button')
    @Guard(isPlayingGuard)
    async pause(interaction: CommandInteraction | ButtonInteraction) {
        const [member] = await getInteractionInfo(interaction)
        distube.pause(interaction.guildId!)
        interaction.reply(`Music paused by ${member.user.tag}`)

        this.message?.edit({
            components: [new MessageActionRow({ components: [playButton, stopButton, skipButton] })],
        })
    }

    @Slash('resume', { description: 'Resume the current song.' })
    @ButtonComponent('play_button')
    @Guard(isPausedGuard)
    async resume(interaction: CommandInteraction | ButtonInteraction) {
        const [member] = await getInteractionInfo(interaction)
        distube.resume(interaction.guildId!)
        interaction.reply(`Music resumed by ${member.user.tag}`)

        this.message?.edit({
            components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
        })
    }
}
