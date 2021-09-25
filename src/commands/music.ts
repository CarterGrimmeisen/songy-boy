import { ButtonInteraction, CommandInteraction, Message } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashOption } from 'discordx'
import { RepeatMode } from 'distube'

import { distube, getGuildSettings, setGuildSettings } from '..'
import { getMediaButtonList, getMoreButtonList } from '../controls/mediaControls'
import { nowPlayingEmbed } from '../embeds/nowPlaying'
import { queueFinishedEmbed } from '../embeds/queueFinished'
import { simpleActionMessage } from '../embeds/simpleAction'
import { canSkipGuard, isPausedGuard, isPlayingGuard } from '../guards/queueState'
import { voiceChannelGuards } from '../guards/voiceChannel'
import { disappearingMessage, getInteractionInfo, HandledInteraction, interactionWrapper } from '../util'

@Discord()
export class Music {
	private nowPlayingMessage: Record<string, Message> = {}
	private moreSettingsMessage: Record<string, Message | null> = {}

	private async nowPlaying(interaction: HandledInteraction, disableMore = false) {
		const queue = distube.getQueue(interaction.guildId!)!
		const options = {
			content: null,
			embeds: [nowPlayingEmbed(queue)],
			components: getMediaButtonList(queue, !!this.moreSettingsMessage[interaction.guildId!], disableMore),
			fetchReply: true as const,
		}

		if (!this.nowPlayingMessage[interaction.guildId!]) {
			return interaction.editReply(options).then((message) => {
				if (message instanceof Message) this.nowPlayingMessage[interaction.guildId!] = message
			})
		} else {
			return this.nowPlayingMessage[interaction.guildId!].edit(options)
		}
	}

	private async moreSettings(interaction: HandledInteraction, onlyExisting = true) {
		const options = {
			content: 'More Controls',
			components: getMoreButtonList(distube.getQueue(interaction.guildId!)!),
		}

		const message = this.moreSettingsMessage[interaction.guildId!]

		if (!(message instanceof Message)) {
			if (onlyExisting) return
			this.moreSettingsMessage[interaction.guildId!] = null

			return interaction.editReply(options).then((message) => {
				if (message instanceof Message) this.moreSettingsMessage[interaction.guildId!] = message
			})
		} else if (message instanceof Message) {
			return message.edit(options)
		}
	}

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
				this.nowPlaying(interaction)

				interaction.editReply(
					simpleActionMessage(`${song.name} has been added to the queue.`, {
						thumbnail: song.thumbnail,
					}),
				)
			})

			distube.playVoiceChannel(voiceChannel!, query, { member, textChannel })
		} else {
			const updatePlayingSong = () => {
				this.nowPlaying(interaction)
			}

			const timer = setInterval(() => {
				const queue = distube.getQueue(interaction.guildId!)!
				if (queue) updatePlayingSong()
			}, 5000)

			distube.on('playSong', updatePlayingSong)
			distube.once('initQueue', async (queue) => {
				const settings = await getGuildSettings(interaction.guildId!)
				queue.repeatMode = settings.repeat
				queue.autoplay = settings.autoplay
				queue.volume = settings.volume
				queue.filters = settings.filters
			})

			distube.once('disconnect', (queue) => {
				clearInterval(timer)
				distube.off('playSong', updatePlayingSong)

				this.nowPlayingMessage[interaction.guildId!].delete()
				delete this.nowPlayingMessage[interaction.guildId!]
				this.moreSettingsMessage[interaction.guildId!]?.delete()
				delete this.moreSettingsMessage[interaction.guildId!]

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
		return interactionWrapper(interaction, 'Pausing...', 'Song paused', async () => {
			distube.pause(interaction.guildId!)
			await this.nowPlaying(interaction)
		})
	}

	@Slash('resume', { description: 'Resume the current song.' })
	@ButtonComponent('play_button')
	@Guard(isPausedGuard)
	async resume(interaction: HandledInteraction) {
		return interactionWrapper(interaction, 'Resuming...', 'Song resumed', async () => {
			distube.resume(interaction.guildId!)
			this.nowPlaying(interaction)
		})
	}

	@Slash('skip', { description: 'Skip the current song.' })
	@ButtonComponent('skip_button')
	@Guard(isPlayingGuard, canSkipGuard)
	async skip(interaction: HandledInteraction) {
		return interactionWrapper(interaction, 'Skipping song...', 'Song skipped', async () => {
			distube.skip(interaction.guildId!)
		})
	}

	@Slash('stop', { description: 'Stop the music.' })
	@ButtonComponent('stop_button')
	@Guard(isPlayingGuard)
	async stop(interaction: HandledInteraction) {
		return interactionWrapper(interaction, 'Stopping music...', 'Music stopped', async () => {
			distube.stop(interaction.guildId!)
		})
	}

	@Slash('autoplay', { description: 'Toggle autoplay' })
	@ButtonComponent('autoplay_button')
	@Guard(isPlayingGuard)
	async autoplay(interaction: HandledInteraction) {
		const replyPromise = interaction.reply('Toggling autoplay...')

		const autoplay = distube.getQueue(interaction.guildId!)?.toggleAutoplay()
		setGuildSettings(interaction.guildId!, (settings) => {
			settings.autoplay = autoplay!
		})

		await this.moreSettings(interaction)

		await replyPromise
		disappearingMessage(
			interaction.editReply(simpleActionMessage(`Autoplay is now **${autoplay ? 'on' : 'off'}**`)),
		)
	}

	@Slash('shuffle', { description: 'Shuffle the queue' })
	@Guard(isPlayingGuard)
	async shuffle(interaction: CommandInteraction) {
		return interactionWrapper(interaction, 'Shuffling queue...', 'Queue shuffled', async () => {
			distube.shuffle(interaction.guildId!)
		})
	}

	@Slash('forward', { description: 'Fast forward the current song by 10 seconds' })
	@Guard(isPlayingGuard)
	async fastforward(
		@SlashOption('duration', { description: 'Fast forward the current song by this amount of seconds' })
		duration: number,
		interaction: HandledInteraction,
	) {
		return interactionWrapper(
			interaction,
			'Fast forwarding current song...',
			`Fast forwarded song by ${duration}s`,
			async () => {
				const queue = distube.getQueue(interaction.guildId!)!
				distube.seek(
					interaction.guildId!,
					queue.currentTime + 10 < queue.songs[0].duration
						? queue.currentTime + (duration ?? 10)
						: queue.songs[0].duration - 1,
				)
			},
		)
	}

	@ButtonComponent('ff_button')
	async ff10(interaction: HandledInteraction) {
		this.fastforward(10, interaction)
	}

	@Slash('rewind', { description: 'Rewind the current song by 10 seconds' })
	@Guard(isPlayingGuard)
	async rewind(
		@SlashOption('duration', { description: 'Rewind the current song by this amount of seconds' })
		duration: number,
		interaction: HandledInteraction,
	) {
		return interactionWrapper(
			interaction,
			'Rewinding current song...',
			`Rewound song by ${duration}s`,
			async () => {
				const queue = distube.getQueue(interaction.guildId!)!
				distube.seek(interaction.guildId!, queue.currentTime > duration ? queue.currentTime - duration : 0)
			},
		)
	}

	@ButtonComponent('rw_button')
	async rw10(interaction: HandledInteraction) {
		this.rewind(10, interaction)
	}

	@ButtonComponent('more_button')
	@Guard(isPlayingGuard)
	async more(interaction: ButtonInteraction) {
		await interaction.reply('Loading more controls...')
		await this.moreSettings(interaction, false)
		await this.nowPlaying(interaction, true)
	}

	@ButtonComponent('less_button')
	@Guard(isPlayingGuard)
	async less(interaction: ButtonInteraction) {
		const messsagePromise = interaction.reply({ content: 'Hiding More Controls...', fetchReply: true })
		// TODO: Fix sometimes interaction failing
		if (this.moreSettingsMessage[interaction.guildId!]) {
			const moreSettingsMessage = this.moreSettingsMessage[interaction.guildId!]
			delete this.moreSettingsMessage[interaction.guildId!]

			await Promise.all([
				this.nowPlaying(interaction),
				moreSettingsMessage?.delete(),
				messsagePromise.then((m) => {
					if (m instanceof Message) m.delete()
				}),
			])
		}
	}

	@Slash('repeat', { description: 'Repeat the queue' })
	@ButtonComponent('repeat_none_to_queue_button')
	@Guard(isPlayingGuard)
	async repeatNoneToQueue(interaction: ButtonInteraction) {
		return interactionWrapper(
			interaction,
			'Repeating queue...',
			'Repeat mode is now set to **Queue**',
			async () => {
				distube.setRepeatMode(interaction.guildId!, RepeatMode.QUEUE)

				setGuildSettings(interaction.guildId!, (settings) => {
					settings.repeat = RepeatMode.QUEUE
				})

				await this.moreSettings(interaction)
			},
		)
	}

	@Slash('repeatOne', { description: 'Repeat the queue' })
	@ButtonComponent('repeat_queue_to_one_button')
	@Guard(isPlayingGuard)
	async repeatQueueToOne(interaction: ButtonInteraction) {
		return interactionWrapper(
			interaction,
			'Repeating current song...',
			'Repeat mode is now set to **Song**',
			async () => {
				distube.setRepeatMode(interaction.guildId!, RepeatMode.SONG)

				setGuildSettings(interaction.guildId!, (settings) => {
					settings.repeat = RepeatMode.SONG
				})

				await this.moreSettings(interaction)
			},
		)
	}

	@Slash('norepeat', { description: "Don't repeat anything" })
	@ButtonComponent('repeat_one_to_none_button')
	@Guard(isPlayingGuard)
	async repeatOneToNone(interaction: ButtonInteraction) {
		return interactionWrapper(
			interaction,
			'Disabling repeat...',
			'Repeat mode is now set to **Disabled**',
			async () => {
				distube.setRepeatMode(interaction.guildId!, RepeatMode.DISABLED)

				setGuildSettings(interaction.guildId!, (settings) => {
					settings.repeat = RepeatMode.DISABLED
				})

				await this.moreSettings(interaction)
			},
		)
	}
}
