
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// create reading schema & model
const ReadingSchema = new Schema({
    deviceId: {
        type: String,
    },
    usage: {
        type: Number,
        default: 0
    },
    usedAt: {
        type: Date,
    },
    unitType:{
        type: String,
    },
    cost: {
        type: Number,
        default: 0
    },
    units:{
        type: Number,
        default: 0
    }
});
const Reading = mongoose.model('reading', ReadingSchema);
module.exports = Reading;