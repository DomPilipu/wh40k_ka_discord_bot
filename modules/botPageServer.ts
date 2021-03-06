import express from 'express';
import logger from './logger';
import faqStore from './faqStore';

export default class BotPageServer {
	private server;
	private port: number;

	constructor() {
		this.server = express();
		this.port = process.env.NODE_ENV === 'prod' ? 8080 : process.env.NODE_ENV === 'dev' ? 3000 : 3000;
	}

	startServer() {
		this.configServer();
		this.server.listen(this.port, () => {
			return logger.log(`server is listening on ${this.port}`);
		});
	}

	private configServer() {
		this.server.set('view engine', 'pug');

		this.server.get('/', async (req, res) => {
			const faq = await faqStore.getFaq();

			res.render('home', { title: 'KA_Servitor', message: 'Ich lebe um zu dienen...', faq: faq });
		});
	}
}
