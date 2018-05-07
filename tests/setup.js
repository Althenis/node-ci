jest.setTimeout(30000);

require('../models/User');
const mongoURI = require('../config/keys').mongoURI;
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, { useMongoClient: true });