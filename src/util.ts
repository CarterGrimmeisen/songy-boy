import { GuildMember, Interaction, Message, StageChannel, VoiceChannel } from 'discord.js'
import { client } from '.'

export const getInteractionInfo = async (
    interaction: Interaction,
): Promise<[member: GuildMember, voiceChannel: VoiceChannel | StageChannel | null]> => {
    const member = interaction.member as GuildMember
    return [member, member?.voice?.channel]
}
