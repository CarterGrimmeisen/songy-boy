import {
	ButtonInteraction,
	CommandInteraction,
	GuildMember,
	Interaction,
	Message,
	StageChannel,
	TextChannel,
	VoiceChannel,
} from 'discord.js'

export type HandledInteraction = CommandInteraction | ButtonInteraction

export const getInteractionInfo = async (
	interaction: Interaction,
): Promise<[member: GuildMember, voiceChannel: VoiceChannel | StageChannel | null, textChannel: TextChannel]> => {
	const member = interaction.member as GuildMember
	return [member, member.voice.channel, interaction.channel as TextChannel]
}

export const disappearingMessage = async <T>(messagePromise: Promise<Message | T>) => {
	setTimeout(async () => ((await messagePromise) as Message).delete(), 5000)
}
