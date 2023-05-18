
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// create reading schema & model
const DeviceSchema = new Schema({
    deviceId:{
        type: Number
    },
    deviceName: {
        type: String,
    },
    userId: {
        type: String,
    },
    createdDate:{
        type: Date,
        default: null
    }
});
const Device = mongoose.model('device', DeviceSchema);
module.exports = Device;