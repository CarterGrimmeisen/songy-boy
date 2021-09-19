import 'reflect-metadata'
import { Intents } from 'discord.js'
import { Client } from 'discordx'
import { DisTube } from 'distube'
import { exit } from 'process'
import dotenv from 'dotenv'

export const { parsed: config, error } = dotenv.config()

if (error) exit(1)

export const client = new Client({
    botId: '888662682197184525',
    botGuilds: ['888607400695836702'],
    prefix: async () => {
        return '!'
    },
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
