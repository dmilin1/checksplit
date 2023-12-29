const receipt = require('../dummyData/receipt');
const ReceiptReader = require('../helpers/ReceiptReader');

const client_id = process.env.VERYFI_CLIENT_ID;
const client_secret = process.env.VERYFI_CLIENT_SECRET;
const username = process.env.VERYFI_USERNAME;
const api_key = process.env.VERYFI_API_KEY;


module.exports = (app) => {
  app.post('/api/processReceipt', async (req, res) => {
    const receiptReader = new ReceiptReader();
    const results = await receiptReader.imageFileToJSON(req.files.body.tempFilePath);
    results.items.forEach(item => {
      item.itemPrice = item.totalPrice / item.quantity;
    });
    results.subtotal = results.items.reduce((acc, item) => acc + item.totalPrice, 0);
    res.send(results);
	})
}