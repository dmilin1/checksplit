const createRoom = require("./createRoom");
const processReceipt = require("./processReceipt");

function initAPIs(...args) {
    [
        processReceipt,
        createRoom,
    ].forEach(api => api(...args))
}

module.exports = initAPIs