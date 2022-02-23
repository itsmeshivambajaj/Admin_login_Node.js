const mongoose = require('mongoose')
const db_url = process.env.DB_URL;

mongoose.connect(db_url, { useNewUrlParser: true, useUnifiedTopology:true})
  .then(() => console.log('Connection is Established'))
  .catch((err) => console.log('Error'+err));