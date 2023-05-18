const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserProfileSchema = new Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    phonenumber:{
        type: Number,
    }
});
const UserProfile = mongoose.model('userprofile', UserProfileSchema);
module.exports = UserProfile;