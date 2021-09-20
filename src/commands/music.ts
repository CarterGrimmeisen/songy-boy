import { ButtonInteraction, CommandInteraction, Message, MessageActionRow } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashOption } from 'discordx'
import { Queue } from 'distube'

import { distube } from '..'
import { pauseButton, playButton, skipButton, stopButton } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionEmbed } from '../embeds/simpleAction'
import { isPausedGuard, isPlayingGuard } from '../guards/queueState'
import { voiceChannelGuards } from '../guards/voiceChannel'
import { getInteractionInfo } from '../util'

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
        const [member, voiceChannel] = await getInteractionInfo(interaction)
        distube.playVoiceChannel(voiceChannel!, query, { member })

        const queue = distube.getQueue(interaction.guildId!)

        if (queue && (queue.previousSongs.length > 0 || queue.songs.length > 0)) {
            distube.once('addSong', (_, song) => {
                interaction.reply({
                    content: null,
                    embeds: [simpleActionEmbed(`${song.name} has been added to the queue.`, song.thumbnail)],
                    ephemeral: true,
                })

                this.nowPlayingMessage?.edit({
                    embeds: [nowPlayingEmbed(member, distube.getQueue(interaction.guildId!)!, 'playing')],
                })

                setTimeout(() => interaction.deleteReply(), 10000)
            })
        } else {
            interaction.deferReply()
            const updatePlayingSong = (newQueue: Queue) => {
                distube.once('finish', (queue) => {
                    if (queue.voiceChannel?.id === voiceChannel?.id) {
                        distube.off('playSong', updatePlayingSong)
                        this.nowPlayingMessage?.edit({
                            embeds: [queueFinishedEmbed(voiceChannel!)],
                        })
                    }
                })

                const messageFn = this.nowPlayingMessage === null ? interaction.followUp : this.nowPlayingMessage.edit

                messageFn({
                    content: null,
                    embeds: [nowPlayingEmbed(member, newQueue)],
                    components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
                    fetchReply: true,
                }).then((message) => {
                    if (message instanceof Message) this.nowPlayingMessage = message
                })
            }

            distube.on('playSong', updatePlayingSong)
        }
    }

    @Slash('pause', { description: 'Pause the current song.' })
    @ButtonComponent('pause_button')
    @Guard(isPlayingGuard)
    async pause(interaction: CommandInteraction | ButtonInteraction) {
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
    async resume(interaction: CommandInteraction | ButtonInteraction) {
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
    @Guard(isPlayingGuard)
    async skip(interaction: CommandInteraction | ButtonInteraction) {
        distube.skip(interaction.guildId!)
        interaction.reply({ content: 'Song skipped', ephemeral: true })
    }
}
