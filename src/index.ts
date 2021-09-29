import 'reflect-metadata'

import { Intents } from 'discord.js'
import { Client } from 'discordx'
import { DisTube, RepeatMode } from 'distube'
import { config as parseConfig } from 'dotenv'
import { exit } from 'process'
import JSONdb from 'simple-json-db'

import { allFilters } from './controls/filterList'
import { simpleActionMessage } from './embeds/simpleAction'

export const { parsed: config, error } = parseConfig()

type Settings = {
	id: string
	autoplay: boolean
	volume: number
	filters: string[]
	repeat: RepeatMode
}

export const db = new JSONdb('./settings.json', { asyncWrite: true })
export const getGuildSettings = async (id: string): Promise<Settings> => {
	let settings = db.get(id) as Settings
	if (!settings) {
		settings = {
			id,
			autoplay: false,
			volume: 100,
			filters: [],
			repeat: RepeatMode.DISABLED,
		}
	}

	return settings
}

export const setGuildSettings = async (id: string, callback: (guildSettings: Settings) => void | Promise<void>) => {
	let settings = db.get(id) as Settings
	if (!settings) {
		settings = {
			id,
			autoplay: false,
			volume: 100,
			filters: [],
			repeat: RepeatMode.DISABLED,
		}
	}

	await callback(settings)

	db.set(id, settings)
}

if (error) exit(1)

export const client = new Client({
	botId: config!.BOT_ID,
	botGuilds: JSON.parse(config!.BOT_GUILDS),
	classes: [
		// glob string to load the classes. If you compile your bot, the file extension will be .js
		`${__dirname}/commands/*.{js,ts}`,
	],
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES],
	silent: false,
})

export const distube = new DisTube(client, {
	searchSongs: 1,
	searchCooldown: 30,
	leaveOnEmpty: true,
	emptyCooldown: 1800,
	leaveOnFinish: true,
	leaveOnStop: true,
	customFilters: allFilters,
})

distube.on('error', (channel, error) => {
	console.error(error)
	channel.send(simpleActionMessage(`⛔ ${error.message}`))
})

client.on('ready', () => {
	console.log('>> Bot started')

	client.user?.setActivity({ type: 'LISTENING', name: 'your tunes 🎵' })

	// to create/update/delete discord application commands
	client.initApplicationCommands()
})

client.on('interactionCreate', (interaction) => {
	client.executeInteraction(interaction)
})

client.login(config!.BOT_TOKEN)

process.on('SIGINT', async () => {
	console.log('Caught interrupt signal')

	await Promise.all(
		Array.from(distube.queues.collection.values()).map((queue) => {
			queue.textChannel?.send('🛑 Bot is shutting down for maintainence and will be back up as soon as possible.')
			return queue.stop()
		}),
	)

	await new Promise((res) => setTimeout(res, 1000))

	client.destroy()
	exit(0)
})
