import { CommandInteraction, Message, MessageActionRow } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashOption } from 'discordx'
import { Queue } from 'distube'

import { distube, getGuildSettings, setGuildSettings } from '..'
import { ffButton, pauseButton, playButton, rwButton, skipButton, stopButton } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionEmbed } from '../embeds/simpleAction'
import { canSkipGuard, isPausedGuard, isPlayingGuard } from '../guards/queueState'
import { voiceChannelGuards } from '../guards/voiceChannel'
import { disappearingMessage, getInteractionInfo, HandledInteraction } from '../util'

@Discord()
export class Music {
	private nowPlayingMessage: Record<string, Message> = {}

	@Slash('p', { description: 'Play a song either via search terms or url' })
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
					embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!)],
				})

				setTimeout(async () => ((await messagePromise) as Message).delete(), 5000)
			})
			distube.playVoiceChannel(voiceChannel!, query, { member, textChannel })
		} else {
			const updatePlayingSong = (queue: Queue) => {
				const options = {
					content: null,
					embeds: [nowPlayingEmbed(queue)],
					components: [
						new MessageActionRow({
							components: [
								rwButton,
								queue.playing ? pauseButton : playButton,
								ffButton,
								skipButton,
								stopButton,
							],
						}),
					],
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
			distube.once('initQueue', async (queue) => {
				const settings = await getGuildSettings(interaction.guildId!)
				queue.autoplay = settings.autoplay
				queue.volume = settings.volume
				queue.filters = settings.filters
			})

			distube.once('disconnect', (queue) => {
				clearInterval(timer)
				distube.off('playSong', updatePlayingSong)
				this.nowPlayingMessage[interaction.guildId!].delete()
				delete this.nowPlayingMessage[interaction.guildId!]
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

		distube.getQueue(interaction.guildId!)!.pause()

		this.nowPlayingMessage[interaction.guildId!].edit({
			embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!)],
			components: [
				new MessageActionRow({
					components: [rwButton, playButton, ffButton, skipButton, stopButton],
				}),
			],
		})

		disappearingMessage(interaction.followUp({ content: 'Music paused', fetchReply: true }))
	}

	@Slash('resume', { description: 'Resume the current song.' })
	@ButtonComponent('play_button')
	@Guard(isPausedGuard)
	async resume(interaction: HandledInteraction) {
		interaction.deferReply()

		distube.getQueue(interaction.guildId!)!.resume()

		this.nowPlayingMessage[interaction.guildId!].edit({
			embeds: [nowPlayingEmbed(distube.getQueue(interaction.guildId!)!)],
			components: [
				new MessageActionRow({
					components: [rwButton, pauseButton, ffButton, skipButton, stopButton],
				}),
			],
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

	@Slash('s', { description: 'Stop the music.' })
	@Slash('stop', { description: 'Stop the music.' })
	@ButtonComponent('stop_button')
	@Guard(isPlayingGuard)
	async stop(interaction: HandledInteraction) {
		interaction.deferReply()
		distube.stop(interaction.guildId!)
		disappearingMessage(interaction.followUp({ content: 'Music stopped', fetchReply: true }))
	}

	@Slash('ap', { description: 'Toggle autoplay' })
	@Slash('autoplay', { description: 'Toggle autoplay' })
	@ButtonComponent('autoplay_button')
	@Guard(isPlayingGuard)
	async autoplay(interaction: HandledInteraction) {
		interaction.deferReply()
		const autoplay = distube.getQueue(interaction.guildId!)?.toggleAutoplay()

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.autoplay = autoplay!
		})

		this.nowPlayingMessage[interaction.guildId!].edit({
			components: [
				new MessageActionRow({
					components: [ffButton, pauseButton, stopButton, skipButton, rwButton],
				}),
			],
		})

		disappearingMessage(
			interaction.followUp({
				embeds: [simpleActionEmbed(`Autoplay is now **${autoplay ? 'on' : 'off'}**`)],
				fetchReply: true,
			}),
		)
	}

	@Slash('sh', { description: 'Shuffle the queue' })
	@Slash('shuffle', { description: 'Shuffle the queue' })
	@Guard(isPlayingGuard)
	async shuffle(interaction: CommandInteraction) {
		interaction.deferReply()
		distube.shuffle(interaction.guildId!)
		disappearingMessage(interaction.followUp({ embeds: [simpleActionEmbed('Queue shuffled.')], fetchReply: true }))
	}

	@Slash('ff', { description: 'Fast forward the current song by 10 seconds' })
	@Slash('forward', { description: 'Fast forward the current song by 10 seconds' })
	@ButtonComponent('ff_button')
	@Guard(isPlayingGuard)
	async fastforward(interaction: HandledInteraction) {
		const queue = distube.getQueue(interaction.guildId!)!
		interaction.deferReply()
		distube.seek(
			interaction.guildId!,
			queue.currentTime + 10 < queue.songs[0].duration ? queue.currentTime + 10 : queue.songs[0].duration,
		)
		disappearingMessage(interaction.followUp({ content: 'Fast forwarded', fetchReply: true }), 1)
	}

	@Slash('rw', { description: 'Rewind the current song by 10 seconds' })
	@Slash('rewind', { description: 'Rewind the current song by 10 seconds' })
	@ButtonComponent('rw_button')
	@Guard(isPlayingGuard)
	async rewind(interaction: HandledInteraction) {
		const queue = distube.getQueue(interaction.guildId!)!
		interaction.deferReply()
		distube.seek(interaction.guildId!, queue.currentTime > 10 ? queue.currentTime - 10 : 0)
		disappearingMessage(interaction.followUp({ content: 'Rewound', fetchReply: true }), 1)
	}
}
