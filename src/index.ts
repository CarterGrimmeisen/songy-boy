import 'reflect-metadata'

import { Intents } from 'discord.js'
import { Client } from 'discordx'
import { DisTube } from 'distube'
import { config as parseConfig } from 'dotenv'
import { exit } from 'process'
import JSONdb from 'simple-json-db'

import { allFilters } from './controls/filterList'
import { simpleActionEmbed } from './embeds/simpleAction'

export const { parsed: config, error } = parseConfig()

type Settings = {
	id: string
	autoplay: boolean
	volume: number
	filters: string[]
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
		}
	}

	await callback(settings)

	db.set(id, settings)
}

if (error) exit(1)

export const client = new Client({
	botId: '888662682197184525',
	botGuilds: ['888607400695836702'],
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
	channel.send({
		embeds: [simpleActionEmbed(`⛔ ${error.message.replaceAll('You ', 'I ')}`)],
	})
})

client.on('ready', () => {
	console.log('>> Bot started')

	// to create/update/delete discord application commands
	client.initApplicationCommands()
})

client.on('interactionCreate', (interaction) => {
	client.executeInteraction(interaction)
})

client.login(config!.BOT_TOKEN)

process.on('SIGINT', () => {
	console.log('Caught interrupt signal')

	client.destroy()
	exit(0)
})
