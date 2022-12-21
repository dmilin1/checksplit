const Rooms = require("../rooms")

module.exports = function joinRoom(socket, data) {
    let { roomId, nickname } = data;
    let room = Rooms.getRoom(roomId);
    if (!room) {
        socket.emit('invalidRoom');
        return;
    }
    room.joinRoom(socket, nickname);
}
