import { CommandInteraction, Message, MessageActionRow } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashChoice, SlashOption } from 'discordx'
import { Queue } from 'distube'
import { titleCase } from 'title-case'

import { distube } from '..'
import { allFilters } from '../controls/filterList'
import { pauseButton, playButton, skipButton, stopButton } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionEmbed } from '../embeds/simpleAction'
import { canSkipGuard, hasFiltersGuard, isPausedGuard, isPlayingGuard } from '../guards/queueState'
import { voiceChannelGuards } from '../guards/voiceChannel'
import { disappearingMessage, getInteractionInfo, HandledInteraction } from '../util'

@Discord()
export class Music {
    private nowPlayingMessage: Record<string, Message> = {}

    @Slash('play', { description: 'Play a song either via search terms or url' })
    @Guard(...voiceChannelGuards)
    async play(
        @SlashOption('query', { required: true, description: 'The search terms or URL to play' })
        query: string,
        interaction: CommandInteraction,
    ) {
        interaction.deferReply()
        const [member, voiceChannel, textChannel] = await getInteractionInfo(interaction)
        const queue = distube.getQueue(interaction.guildId!)

        if (queue && (queue.previousSongs.length > 0 || queue.songs.length > 0 || queue.playing || queue.paused)) {
            distube.once('addSong', (_, song) => {
                const messagePromise = interaction.followUp({
                    content: null,
                    embeds: [
                        simpleActionEmbed(`${song.name} has been added to the queue.`, { thumbnail: song.thumbnail }),
                    ],
                    fetchReply: true,
                })

                this.nowPlayingMessage[interaction.guildId!]?.edit({
                    embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!, 'playing')],
                })

                setTimeout(async () => ((await messagePromise) as Message).delete(), 5000)
            })
            distube.playVoiceChannel(voiceChannel!, query, { member, textChannel })
        } else {
            const updatePlayingSong = (queue: Queue) => {
                const options = {
                    content: null,
                    embeds: [nowPlayingEmbed(queue)],
                    components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
                    fetchReply: true,
                }

                if (!this.nowPlayingMessage[interaction.guildId!]) {
                    interaction.followUp(options).then((message) => {
                        if (message instanceof Message) this.nowPlayingMessage[interaction.guildId!] = message
                    })
                } else {
                    this.nowPlayingMessage[interaction.guildId!].edit(options)
                }
            }

            const timer = setInterval(() => {
                const queue = distube.getQueue(interaction.guildId!)!
                if (queue) updatePlayingSong(queue)
            }, 5000)

            distube.on('playSong', updatePlayingSong)
            distube.on('disconnect', (queue) => {
                clearInterval(timer)
                distube.off('playSong', updatePlayingSong)
                this.nowPlayingMessage[interaction.guildId!].delete()
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
        interaction.deferReply()
        distube.pause(interaction.guildId!)

        this.nowPlayingMessage[interaction.guildId!].edit({
            embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!, 'paused')],
            components: [new MessageActionRow({ components: [playButton, stopButton, skipButton] })],
        })

        disappearingMessage(interaction.followUp({ content: 'Music paused', fetchReply: true }))
    }

    @Slash('resume', { description: 'Resume the current song.' })
    @ButtonComponent('play_button')
    @Guard(isPausedGuard)
    async resume(interaction: HandledInteraction) {
        interaction.deferReply()
        distube.resume(interaction.guildId!)

        this.nowPlayingMessage[interaction.guildId!].edit({
            embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!, 'playing')],
            components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
        })

        disappearingMessage(interaction.followUp({ content: 'Music resumed', fetchReply: true }))
    }

    @Slash('skip', { description: 'Skip the current song.' })
    @ButtonComponent('skip_button')
    @Guard(isPlayingGuard, canSkipGuard)
    async skip(interaction: HandledInteraction) {
        interaction.deferReply()
        distube.skip(interaction.guildId!)
        disappearingMessage(interaction.followUp({ content: 'Song skipped', fetchReply: true }))
    }

    @Slash('stop', { description: 'Stop the music.' })
    @ButtonComponent('stop_button')
    @Guard(isPlayingGuard)
    async stop(interaction: HandledInteraction) {
        interaction.deferReply()
        distube.stop(interaction.guildId!)
        disappearingMessage(interaction.followUp({ content: 'Music stopped', fetchReply: true }))
    }

    @Slash('filter', { description: 'Add an audio filter' })
    @Guard(isPlayingGuard)
    async filter(
        @SlashOption('filter', { required: true, description: 'The filter to add' })
        @SlashChoice(Object.fromEntries(Object.entries(allFilters).map(([key]) => [titleCase(key), key])))
        filter: string,
        interaction: CommandInteraction,
    ) {
        interaction.deferReply()
        distube.getQueue(interaction.guildId!)?.setFilter(filter)
        disappearingMessage(
            interaction.followUp({
                embeds: [simpleActionEmbed(`${titleCase(filter)} filter has been applied`)],
                fetchReply: true,
            }),
        )
    }

    @Slash('clearfilters', { description: 'Remove an audio filter' })
    @Guard(isPlayingGuard, hasFiltersGuard)
    async clearFilters(interaction: CommandInteraction) {
        interaction.deferReply()
        distube.getQueue(interaction.guildId!)?.setFilter(false)
        disappearingMessage(
            interaction.followUp({
                embeds: [simpleActionEmbed('All filters removed')],
                fetchReply: true,
            }),
        )
    }

    @Slash('autoplay', { description: 'Toggle autoplay' })
    @Guard(isPlayingGuard)
    async autoplay(interaction: CommandInteraction) {
        interaction.deferReply()
        distube.getQueue(interaction.guildId!)?.toggleAutoplay()

        disappearingMessage(
            interaction.followUp({
                embeds: [simpleActionEmbed('Toggled autoplay')],
                fetchReply: true,
            }),
        )
    }

    @Slash('volume', { description: 'Change the volume' })
    @Guard(isPlayingGuard)
    async volume(
        @SlashOption('volume')
        volume: number,
        interaction: HandledInteraction,
    ) {
        interaction.deferReply()
        if (volume < 0 || volume > 150) {
            return interaction.followUp({ content: 'Volume must be between 0 and 150', ephemeral: true })
        }

        distube.getQueue(interaction.guildId!)?.setVolume(volume)
        disappearingMessage(
            interaction.followUp({
                embeds: [simpleActionEmbed('Toggled autoplay')],
                fetchReply: true,
            }),
        )
    }
}
