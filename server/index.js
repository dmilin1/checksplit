const express = require('express');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const path = require('path');
const fileUpload = require('express-fileupload');
const http = require('http');

const initAPIs = require('./apis');
const initSockets = require('./sockets');

const app = express();
const server = http.createServer(app);


app.use(fileUpload({
	limits: { fileSize: 50 * 1024 * 1024 },
	useTempFiles : true,
	tempFileDir : '/tmp/'
}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use((req, res, next) => {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});

initAPIs(app)

app.use(express.static(path.join(__dirname, '../build')))

app.get('/sitemap', (req, res) => {
	res.sendFile(path.join(__dirname+'/../public/sitemap.xml'))
});
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/../build/index.html'))
});
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/../public/index.html'))
})

const io = new Server(server, {
	cors: {
		origin: "*"
	}
});

initSockets(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () =>
	console.log('Express server is listening on port: ' + PORT)
);