'use strict'

/** Follow Followers Target **/
/** CODE BY CCOCOT | CCOCOT.CO **/
/** ccocot@bc0de.net **/
/** BC0DE.NET - NAONLAH.NET - WingKocoli **/

const Client = require('instagram-private-api').V1;
const delay = require('delay');
const chalk = require('chalk');
const rp = require('request-promise');
const _ = require('lodash');

const User = {
    username: 'panjiiguntoro',
    password: 'bangsadlo12'
}

const TargetUsername = 'farizaynn';

const Login = async function(User){

    /** Save Account **/
    const Device = new Client.Device(User.username);
    const Storage = new Client.CookieMemoryStorage();
    const session = new Client.Session(Device, Storage);

    try {
        await Client.Session.create(Device, Storage, User.username, User.password)
        const account = await session.getAccount();
        return Promise.resolve({session,account});
    } catch (err) {
        return Promise.reject(err);
    }

}

const Target = async function(username){

	const option = {
		url: 'https://www.instagram.com/'+username+'/?__a=1',
		method: 'GET',
		json:true
	}
	try{
		const account = await rp(option);
		if (account.user.is_private) {
			return Promise.reject('Target is private Account');
		} else {
			const id = account.user.id;
			const followers = account.user.followed_by.count;
			return Promise.resolve({id,followers});			
		}
	} catch (err){
		return Promise.reject(err);
	}

}

const Feed = async function(session, accountId, cursor){

	const feed = new Client.Feed.AccountFollowers(session, accountId);
	if (cursor) {
		feed.setCursor(cursor);
	}
	try {
		var result = await feed.get();
		const Account = [];
		await Promise.all(result.map(async(account) => {
			if(account.params.isPrivate === false){
				Account.push({id:account.params.id,username:account.params.username});
			}
		}))
		const getCursor = await feed.getCursor();
		return Promise.resolve({Account,getCursor});
	} catch (err) {
		return Promise.reject(err);
	}
}

const CommentLastPhoto = async function(session, accountId, text){

	const feed = new Client.Feed.UserMedia(session, accountId);

	try {
		const result = await feed.get();
		if (result.length > 0) {
			await Client.Comment.create(session, result[0].params.id, text);
			return true;
		}
	} catch (err) {
		return false;
	}

};

const Excute = async function(User, TargetUsername, TextComment){

	try {
		console.log(chalk`{bold.yellow [?] }Try to Login..`);
		const doLogin = await Login(User);
		console.log(chalk`{bold.green [+] }Login success, Try to get Followers and Id ${TargetUsername} ..`)
		const getTarget = await Target(TargetUsername);
		console.log(chalk`{bold.green [+] }Id target found ${getTarget.id}, ${getTarget.followers} Followers,Try to doAction..\n`)
		var cursor = null;
		do {
			const doAction = await Feed(doLogin.session, getTarget.id, cursor);
			const account = _.chunk(doAction.Account,10);
			cursor = doAction.cursor || null;
			for (let i = 0; i < account.length; i++) {
				await Promise.all(account[i].map(async(account) => {
					await Client.Relationship.create(doLogin.session, account.id);
					console.log(chalk`{bold.green [+|Followed]} ({bold.cyan ${account.username}}) ${account.id}`);				
				}))
				console.log(chalk`{bold.yellow [!]} Delay For 120000 Milisecond (2 Minute) To Send Comment`);
				await delay(120000);
				await Promise.all(account[i].map(async(account) => {
					const doComment = CommentLastPhoto(doLogin.session, account.id, TextComment);
					if (doComment) {
						console.log(chalk`{bold.green [+|Comment Added]} ({bold.cyan ${account.username}}) ${account.id} => ${TextComment}`);
					} else {
						console.log(chalk`{bold.red [-|Comment Failed]} ({bold.cyan ${account.username}}) ${account.id} => GAGAL`);
					}
				}));
				console.log(chalk`{bold.yellow [!]} Delay For 180000 Milisecond (3 Minute) To Next Block`);
				await delay(180000);
			}
			console.log(chalk`{bold.yellow [!]} Delay For 300000 Milisecond (5 Minute) To Next Cursor`);
			await delay(300000);
		}
		while(cursor != null);
	} catch (err) {
		console.log(err);
	}

}

const TextComment = "Follback ya';
Excute(User,TargetUsername,TextComment);
