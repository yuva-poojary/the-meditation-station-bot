const { Route, util: { encrypt, decrypt }, constants: { RESPONSES } } = require('klasa-dashboard-hooks');
const fetch = require('node-fetch');

module.exports = class extends Route {

	constructor(...args) {
		super(...args, { route: 'oauth/callback' });
	}

	get oauthUser () {
		return this.store.get('oauthUser');
	}

	async get (request, response) {
		/* eslint-disable camelcase */
		if (!request.query.code) return this.noCode(response);
		if (!request.query.state) return response.end(JSON.stringify({ error: "State was not returned." }));
		request.query.state = request.query.state.replace(/[ ]/gm, '+');

		try {
			var state = decrypt(request.query.state, this.client.options.clientSecret);
		} catch (e) {
			return response.end(JSON.stringify({ error: "Unable to decrypt returned state. Clickjacking might have occurred!", state: request.query.state }))
		}

		const url = new URL('https://discordapp.com/api/oauth2/token');
		url.search = new URLSearchParams([
			[ 'grant_type', 'authorization_code' ],
			[ 'redirect_uri', request.query.redirectUri || this.client.options.dashboardHooks.redirectUri ],
			[ 'code', request.query.code ]
		]);
		var res = await fetch(url, {
			headers: { Authorization: `Basic ${Buffer.from(`${this.client.options.clientID}:${this.client.options.clientSecret}`).toString('base64')}` },
			method: 'POST'
		});

		if (!res.ok) return response.end(RESPONSES.FETCHING_TOKEN);

		const { oauthUser } = this;

		if (!oauthUser) return this.notReady(response);

		const body = await res.json();
		var user = await oauthUser.api(body.access_token);
		var user2 = await this.client.users.fetch(user.id);

		const access_token = encrypt({
			token: body.access_token,
			scope: [ user.id, ...user.guilds.filter(guild => guild.userCanManage).map(guild => guild.id) ]
		}, this.client.options.clientSecret);

		const redirectURL = `${state.redirect}#access_token=${encodeURI(access_token)}&state=${encodeURI(state.ID)}&user=${user2.id}&tag=${encodeURI(user2.tag)}&avatar=${encodeURI(user2.displayAvatarURL({ format: 'png' }))}`;

		response.writeHead(302,
			{ Location: redirectURL }
		);
		return response.end();
	}

	notReady (response) {
		response.writeHead(500);
		return response.end(RESPONSES.NOT_READY);
	}

	noCode (response) {
		response.writeHead(400);
		return response.end(RESPONSES.NO_CODE);
	}

};
