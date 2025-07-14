require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const {startBot} = require('./services/whatsappService');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    startBot(); // optional: restrict this to only admin users if needed
  });
});
