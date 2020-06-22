const Discord = require('discord.js');
const writeJsonFile = require('write-json-file');
const loadJsonFile = require('load-json-file');

const prefix = '!';
const addCommand = prefix + 'add';
const deleteCommand = prefix + 'delete';

class Bot {
	constructor(logger) {
		this.logger = logger;
		this.discordBot = new Discord.Client();
		this.faq = {};
		this.botReady = false;
	}

	async saveFAQ() {
		await writeJsonFile('faq.json', this.faq);
	}

	async init() {
		this.discordBot.login(process.env.BOT_TOKEN);

		this.faq = await loadJsonFile('faq.json');

		this.registerReady();
		this.registerBotMention();
		this.registerAddFaqCommand();
		this.registerDeleteFaqCommand();
		this.registerSendFaqAnswer();
	}

	async registerReady() {
		this.discordBot.on('ready', async () => {
			this.botReady = true;
			this.logger.log('bot online');
		});
	}

	async registerBotMention() {
		this.discordBot.on('message', async (message) => {
			if (message.author.bot) {
				return;
			}
			if (message.content.includes(this.discordBot.user.id)) {
				this.logger.log('mention registred');
				return await message.channel.send('Ich lebe um zu dienen...');
			}
		});
	}

	async registerAddFaqCommand() {
		this.discordBot.on('message', async (message) => {
			if (message.author.bot) {
				return;
			}

			if (!message.content.startsWith(addCommand)) {
				return;
			}

			if (
				!message.channel
					.permissionsFor(message.member)
					.has('ADMINISTRATOR')
			) {
				this.logger.log(
					'command execution denied because of permissions'
				);
				return await message.channel.send(
					'Du verfügst nicht über die nötigen Zugangsrechte um dieses Kommando auszuführen.'
				);
			}

			const content = message.content
				.substring(addCommand.length + 1)
				.split(' - ');

			if (content.length < 2) {
				this.logger.log('command failed, wrong arguments');
				return await message.channel.send(
					'Argumentliste unvollständig. Erbete erneute Eingabe.'
				);
			}

			this.faq[content[0].toLowerCase()] = content[1];

			await writeJsonFile('faq.json', this.faq);

			this.logger.logBotFAQ('new faq message', content[0], content[1]);
			return await message.channel.send('Kommando ausgeführt.');
		});
	}

	async registerDeleteFaqCommand() {
		this.discordBot.on('message', async (message) => {
			if (message.author.bot) {
				return;
			}

			if (!message.content.startsWith(deleteCommand)) {
				return;
			}

			if (
				!message.channel
					.permissionsFor(message.member)
					.has('ADMINISTRATOR')
			) {
				this.logger.log(
					'command execution denied because of permissions'
				);
				return await message.channel.send(
					'Du verfügst nicht über die nötigen Zugangsrechte um dieses Kommando auszuführen.'
				);
			}

			const content = message.content.substring(deleteCommand.length + 1);

			let phraseDeleted = this.faq[content.toLowerCase()];

			delete this.faq[content.toLowerCase()];

			await writeJsonFile('faq.json', this.faq);

			this.logger.logBotFAQ(
				'faq entry deleted',
				content.toLowerCase(),
				phraseDeleted
			);

			return await message.channel.send('Kommando ausgeführt.');
		});
	}

	async registerSendFaqAnswer() {
		this.discordBot.on('message', async (message) => {
			if (message.author.bot) {
				return;
			}

			if (message.content.startsWith(prefix)) {
				return;
			}

			const content = message.content.toLowerCase();

			for (const key in this.faq) {
				if (content.includes(key)) {
					await message.channel.send(this.faq[key]);
					this.logger.logBotFAQ(
						'faq message send',
						key,
						this.faq[key]
					);
					break;
				}
			}
		});
	}

	async sendMessageToChannel(channelId, message) {
		if (this.botReady) {
			this.discordBot.channels.fetch(channelId).then(async (channel) => {
				await channel.send(message);
			});
		}
	}
}

module.exports = Bot;
