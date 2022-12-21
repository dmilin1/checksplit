const joinRoom = require("./joinRoom");
const roomUpdate = require("./roomUpdate");

function initSockets(io) {
    io.on('connection', (socket) => {
        socket.on('joinRoom', (data) => joinRoom(socket, data));
        socket.on('roomUpdate', (data) => roomUpdate(socket, data));
    });
}

module.exports = initSockets