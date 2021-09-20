import { CommandInteraction, Message, MessageActionRow } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashOption } from 'discordx'
import { Queue } from 'distube'

import { distube } from '..'
import { pauseButton, playButton, skipButton, stopButton } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionEmbed } from '../embeds/simpleAction'
import { canSkipGuard, isPausedGuard, isPlayingGuard } from '../guards/queueState'
import { voiceChannelGuards } from '../guards/voiceChannel'
import { getInteractionInfo, HandledInteraction } from '../util'

@Discord()
export class Music {
    private nowPlayingMessage: Message | null = null

    @Slash('play', { description: 'Play a song either via search terms or url' })
    @Guard(...voiceChannelGuards)
    async play(
        @SlashOption('query', { required: true, description: 'The search terms or URL to play' })
        query: string,
        interaction: CommandInteraction,
    ) {
        const [member, voiceChannel, textChannel] = await getInteractionInfo(interaction)
        const queue = distube.getQueue(interaction.guildId!)

        interaction.deferReply()

        if (queue && (queue.previousSongs.length > 0 || queue.songs.length > 0 || queue.playing || queue.paused)) {
            distube.once('addSong', (_, song) => {
                const messagePromise = interaction.followUp({
                    content: null,
                    embeds: [simpleActionEmbed(`${song.name} has been added to the queue.`, song.thumbnail)],
                    fetchReply: true,
                })

                this.nowPlayingMessage?.edit({
                    embeds: [nowPlayingEmbed(member, distube.getQueue(interaction.guildId!)!, 'playing')],
                })

                setTimeout(async () => ((await messagePromise) as Message).delete(), 5000)
            })
            distube.playVoiceChannel(voiceChannel!, query, { member })
        } else {
            const updatePlayingSong = (newQueue: Queue) => {
                const options = {
                    content: null,
                    embeds: [nowPlayingEmbed(member, newQueue)],
                    components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
                    fetchReply: true,
                }

                if (this.nowPlayingMessage === null) {
                    interaction.followUp(options).then((message) => {
                        if (message instanceof Message) this.nowPlayingMessage = message
                    })
                } else {
                    this.nowPlayingMessage.edit(options)
                }
            }

            distube.on('playSong', updatePlayingSong)
            distube.on('disconnect', (queue) => {
                distube.off('playSong', updatePlayingSong)
                this.nowPlayingMessage?.delete()
                queue.textChannel!.send({
                    content: null,
                    embeds: [queueFinishedEmbed(voiceChannel!)],
                })
            })

            distube.playVoiceChannel(voiceChannel!, query, { member, textChannel })
        }
    }

    @Slash('pause', { description: 'Pause the current song.' })
    @ButtonComponent('pause_button')
    @Guard(isPlayingGuard)
    async pause(interaction: HandledInteraction) {
        const [member] = await getInteractionInfo(interaction)
        distube.pause(interaction.guildId!)
        interaction.reply({ content: 'Music paused', ephemeral: true })

        this.nowPlayingMessage?.edit({
            embeds: [nowPlayingEmbed(member, distube.getQueue(interaction.guildId!)!, 'paused')],
            components: [new MessageActionRow({ components: [playButton, stopButton, skipButton] })],
        })
    }

    @Slash('resume', { description: 'Resume the current song.' })
    @ButtonComponent('play_button')
    @Guard(isPausedGuard)
    async resume(interaction: HandledInteraction) {
        const [member] = await getInteractionInfo(interaction)
        distube.resume(interaction.guildId!)
        interaction.reply({ content: 'Music resumed', ephemeral: true })

        this.nowPlayingMessage?.edit({
            embeds: [nowPlayingEmbed(member, distube.getQueue(interaction.guildId!)!, 'playing')],
            components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
        })
    }

    @Slash('skip', { description: 'Skip the current song.' })
    @ButtonComponent('skip_button')
    @Guard(isPlayingGuard, canSkipGuard)
    async skip(interaction: HandledInteraction) {
        distube.skip(interaction.guildId!)
        interaction.reply({ content: 'Song skipped', ephemeral: true })
    }
}
