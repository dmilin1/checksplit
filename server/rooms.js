module.exports = class Rooms {
	static rooms = {};
	static UPDATABLE_FIELDS = new Set([
		'venmoId',
		'participants',
		'tip',
	]);

	static createRoom({ receipt, venmoId }) {
		let self = new Rooms();
		self.id = [...Array(5)].map(_ => String.fromCharCode(65+Math.random()*26)).join('');
		self.receipt = receipt;
		self.venmoId = venmoId;
		self.participants = {};
		self.tip = 15;
		self.sockets = new Set();
		self.createdAt = Date.now();
		Rooms.rooms[self.id] = self;
		if (Object.keys(Rooms.rooms).length > 100) {
			let oldestKey = Object.entries(Rooms.rooms).sort((a, b) => a[1].createdAt > b[1].createdAt ? 1 : -1)[0];
			delete Rooms.rooms[oldestKey];
		}
		self.log('room created');
		return self;
	}

	static getRoom(roomId) {
		if (!roomId || typeof roomId !== 'string') {
			return null;
		}
		return Rooms.rooms[roomId.toUpperCase()];
	}

	joinRoom(socket, nickname) {
		this.sockets.add(socket);
		if (!this.participants[nickname]) {
			this.log(`${nickname} joined`);
			this.participants[nickname] = [];
		}
		this.emitUpdate();
	}

	receiveUpdate(newItems) {
		Object.keys(newItems).forEach(key => {
			if (Rooms.UPDATABLE_FIELDS.has(key)) {
				this[key] = newItems[key];
			}
		});
		this.emitUpdate(newItems);
	}

	// Emits a full update if newItems is empty
	emitUpdate(newItems) {
		let data = {};
		if (!newItems) {
			data = {
				receipt: this.receipt,
			};
			Rooms.UPDATABLE_FIELDS.forEach(key => {
				data[key] = this[key];
			});
		} else {
			Object.keys(newItems).forEach(key => {
				data[key] = this[key];
			});
		}
		this.sockets.forEach(socket => socket.emit('roomUpdate', data));
	}

	log(msg) {
		console.log(`${this.id}: ${msg}`)
	}
}