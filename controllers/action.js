const { errorHandler } = require('../helpers/dbErrorHandler');
const jwt = require('jsonwebtoken'); // to generate signed token
const user = require('../models/user');
const request = require('request');

exports.findNearestUser = async (req, res) => {

    try {

        const latitude = req.body.latitude;
        const longitude = req.body.longitude;

        const store_data = await user.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    key: "location",
                    maxDistance: parseFloat(2000) * 1609,
                    distanceField: "dist.calculated",
                    spherical: true,
                    distanceMultiplier: 0.001
                }
            }
        ]).limit(6)
        res.status(200).send({ success: true, msg: "Store details", data: store_data });

    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

exports.getUserData = (req, res) => {
    const { id } = req.params;
    user.findById(id)
        .then(data => {
            if (!data)
                res.status(404).send({ message: "errCode: Invalid_RequestId. errMsg: No user found or invalid User ID " + id })
            else res.send({ data });
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving with User id=" + id });
        });
}

exports.updateuser = (req, res) => {
    const { id } = req.params;
    let body = req.body;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${body.zipcode}&key=c2da078ccba94abaa4aba22e893bebf8&language=en&pretty=1`

    request({ url: url, json: true }, (error, response) => {
        if (error) {
            console.log('unable to connect to api', error)
        } else {
            var data = response.body
            initialVal = Object.values(data.results[0].geometry)
            let output = [initialVal[0], initialVal[1]] = [initialVal[1], initialVal[0]];
            let origin = { type: "Point", coordinates: output }
            let info = {
                name: body.name,
                email: body.email,
                phone: body.phone,
                image: body.image,
                zipcode: body.zipcode,
                location: origin,
            }
            user.findByIdAndUpdate(id, info, { useFindAndModify: false })
                .then(data => {
                    if (!data) {
                        res.status(404).send({
                            message: `Cannot update data with id=${id}. Maybe User was not found!`
                        });
                    } else res.send({ message: " updated successfully." });
                })
                .catch(err => {
                    res.status(500).send({
                        message: "Error updating User with id=" + id
                    });
                });
        }
    })
}

exports.getUserList = (req, res) => {
    user.find()
        .then(data => {
            if (!data)
                res.status(404).send({ message: "errCode: Invalid_RequestId. errMsg: No User found "})
            else res.send({ data });
        })
        .catch(err => {
            res
                .status(500)
                .send({ message: "Error retrieving User List"});
        });
}


