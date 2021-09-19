import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    GuildMember,
    MessageEmbed,
} from 'discord.js'
import { ButtonComponent, Discord, Slash, SlashOption } from 'discordx'
import { getInteractionInfo } from '../util'
import { distube } from '..'
import { Queue, Song } from 'distube'
import { pauseButton, stopButton, skipButton } from '../controls/mediaControls'

@Discord()
export class Play {
    @Slash('play', { description: 'Play a song either via search terms or url' })
    async play(
        @SlashOption('query', { required: true, description: 'The search terms or URL to play' })
        query: string,
        interaction: CommandInteraction,
    ) {
        const [member, voiceChannel] = await getInteractionInfo(interaction)
        if (!voiceChannel) return interaction.reply('You need to be in a voice channel to use this command')
        distube.playVoiceChannel(voiceChannel, query, { member })
        interaction.reply({
            content: `Searching for "${query}"...`,
            ephemeral: (distube.getQueue(interaction.guildId!)?.songs.length ?? 0) > 0,
        })

        const whenSongAdded = (queue: Queue, song: Song) => {
            distube.off('addSong', whenSongAdded)
            if (queue.songs.length === 1) {
                interaction.editReply({
                    content: null,
                    embeds: [
                        new MessageEmbed({
                            title: 'Now Playing',
                            description: `${song.name} - Uploaded by ${song.uploader.name}`,
                            image: { url: song.thumbnail },
                            footer: {
                                text: `Added by: ${member.user.tag}`,
                                iconURL: member.user.displayAvatarURL({ dynamic: true }),
                            },
                        }),
                    ],
                    components: [new MessageActionRow({ components: [pauseButton, stopButton, skipButton] })],
                })
            } else {
                interaction.editReply({
                    content: null,
                    embeds: [
                        new MessageEmbed({
                            title: `Added ${song.name} to the queue`,
                            thumbnail: { url: song.thumbnail },
                            footer: {
                                text: `Added by: ${member.user.tag}`,
                                iconURL: member.user.displayAvatarURL({ dynamic: true }),
                            },
                        }),
                    ],
                })
            }
        }
        distube.on('addSong', whenSongAdded)
        // // @ts-expect-error Not working atm
        // distube.playVoiceChannel(voiceChannel, query)
        //   const helloBtn = new MessageButton()
        //     .setLabel("Hello")
        //     .setEmoji("👋")
        //     .setStyle("PRIMARY")
        //     .setCustomId("hello-btn");
        //   const row = new MessageActionRow().addComponents(helloBtn);
        //   interaction.reply({
        //     content: "Say hello to bot",
        //     components: [row],
        //   });
    }
}
