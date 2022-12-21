const Rooms = require("../rooms")

module.exports = function roomUpdate(socket, data) {
    let { roomId, update } = data;
    let room = Rooms.getRoom(roomId);
    if (!room) {
        socket.emit('invalidRoom');
        return;
    }
    room.receiveUpdate(update);
}
