const Rooms = require("../rooms")

module.exports = (app) => {
  app.post('/api/createRoom', async (req, res) => {
    if (!req?.body?.receipt) {
      res.sendStatus(400);
      return;
    }
    const room = Rooms.createRoom(req.body);
    res.send({
      roomId: room.id
    });
  })
}