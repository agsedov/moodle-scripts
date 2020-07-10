var fs = require('fs').promises;

class UserCache {
	constructor(){
		this.users = {};
		this.getFromFile();
	}

	getUser(id) {
		let filtered = this.users.filter(u=>u.id === id);
		if(filtered[0]) {
			return filtered[0];
		} else {
			return null;
		}
	}

	addUser(id,name) {
		this.users[id.toString()] = name;
	}

	getUser(id) {
		return this.users[id.toString()];
	}

	async saveToFile() {
		const dataStr = JSON.stringify(this.users, null, 2);
		await fs.writeFile('./users.json', dataStr);
	}

	async getFromFile() {
		try {
			const data = await fs.readFile('./users.json', 'utf8');
			console.log(data);
			this.users = JSON.parse(data);
		} catch (e) {
			console.warn('fail');
			this.users = {};
		}
	}
}

module.exports = UserCache;
