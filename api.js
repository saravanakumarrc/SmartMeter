const express = require('express');
const router = express.Router();
const Reading = require('./reading');
const Subscription = require('./subscription');
const UserProfile = require('./userprofile');
const Alert = require('./alert');
const Device = require('./device');

router.get('/readings', function (req, res, next) {
    Reading.find({}).then(function (readings) {
        res.send(readings);
    }).catch(next);
});
router.get('/alerts/:deviceId', function (req, res, next) {
    var { alertType } = req.query;
    Alert.find({ deviceId: req.params.deviceId, alertType }).then(function (alert) {
        res.send(alert);
    }).catch(next);
});
router.get('/readings/:deviceId', function (req, res, next) {
    var { unit, amount, unitType } = req.query;
    var query = { deviceId: req.params.deviceId, unitType };
    if(unit && amount){
        query = {
            ...query,
            $expr:{
                $gt:
                   [
                      "$usedAt",
                       {
                          $dateSubtract:
                             {
                                startDate: "$$NOW",
                                unit: unit,
                                amount: Number(amount)
                             }
                       }
                   ]
             }   
        }
    }
        
    Reading.find(query).then(function (readings) {
        res.send(readings);
    }).catch(next);
});
router.post('/readings', function (req, res, next) {
    Reading.create(req.body).then(function (reading) {
        res.send(reading);
    }).catch(next);
});
router.post('/alerts', function (req, res, next) {
    Alert.create(req.body).then(function (alert) {
        res.send(alert);
    }).catch(next);
});
router.put('/readings/:id', function (req, res, next) {
    Reading.findOneAndUpdate({ _id: req.params.id }, req.body).then(function (reading) {
        Reading.findOne({ _id: req.params.id }).then(function (reading) {
            res.send(reading);
        });
    });
});
router.delete('/readings/:id', function (req, res, next) {
    Reading.findOneAndDelete({ _id: req.params.id }).then(function (reading) {
        res.send(reading);
    });
});
router.post('/subscriptions', function (req, res, next) {
    var subscription = {
        endpoint: req.body.endpoint,
        expirationTime: req.body.expirationTime,
        keys_p256dh: req.body.keys.p256dh,
        keys_auth: req.body.keys.auth,
        deviceId: req.body.deviceId
    }
    Subscription.create(subscription).then(function (subscription) {
        res.send(subscription);
    }).catch(next);
});
router.get('/subscriptions/:deviceId', function (req, res, next) {
    var query = { deviceId: req.params.deviceId };
    Subscription.find(query).then(function (subscription) {
        res.send(subscription);
    }).catch(next);
});

router.post('/userprofiles', function (req, res, next) {
    UserProfile.create(req.body).then(function (userprofile) {
        res.send(userprofile);
    }).catch(next);
});
router.post('/login', function (req, res, next) {
    UserProfile.findOne(req.body).then(function (userprofile) {
        res.send(userprofile);
    }).catch(next);
});
router.post('/devices', function (req, res, next) {
    Device.create(req.body).then(function (device) {
        res.send(device);
    }).catch(next);
});
router.get('/devices/:userId', function (req, res, next) {
    var query = { userId: req.params.userId };
    Device.find(query).then(function (subscription) {
        res.send(subscription);
    }).catch(next);
});
router.delete('/devices/:id', function (req, res, next) {
    Device.findOneAndDelete({ _id: req.params.id }).then(function (reading) {
        res.send(reading);
    });
});
module.exports = router;