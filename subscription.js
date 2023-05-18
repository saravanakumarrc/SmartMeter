const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create reading schema & model
const SubscriptionSchema = new Schema({
    endpoint: {
        type: String,
    },
    expirationTime: {
        type: Number,
        default: 0
    },
    keys_p256dh: {
        type: String,
    },
    keys_auth:{
        type: String,
    },
    deviceId:{
        type: String,
    }
});
const Subscription = mongoose.model('subscription', SubscriptionSchema);
module.exports = Subscription;