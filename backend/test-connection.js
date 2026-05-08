require('dotenv').config();
const dns = require('dns');
// Force Google DNS to bypass local DNS blocking SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ Connected to Atlas!'); process.exit(0); })
  .catch(e => { console.error('❌', e.message); process.exit(1); });
