const mongoose = require('mongoose');
const ScrapRequest = require('./ScrapRequest');

// Export the 'Scrap' model referencing the same schema and underlying collection as 'ScrapRequest'
module.exports = mongoose.models.Scrap || mongoose.model('Scrap', ScrapRequest.schema);
