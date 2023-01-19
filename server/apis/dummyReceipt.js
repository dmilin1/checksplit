const Client = require('@veryfi/veryfi-sdk');

const client_id = process.env.VERYFI_CLIENT_ID;
const client_secret = process.env.VERYFI_CLIENT_SECRET;
const username = process.env.VERYFI_USERNAME;
const api_key = process.env.VERYFI_API_KEY;


module.exports = (app) => {
  app.post('/api/processReceipt', async (req, res) => {
    let veryfi_client = new Client(client_id, client_secret, username, api_key);
    let response = await veryfi_client.process_document(req.files.body.tempFilePath);
    res.send(response);
	})
}