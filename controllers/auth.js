const User = require('../models/user');
const jwt = require('jsonwebtoken'); // to generate signed token
const expressJwt = require('express-jwt'); // for authorization check
const { errorHandler } = require('../helpers/dbErrorHandler');
const request = require('request');
const { response } = require('express');

exports.signup = (req, res) => {
    let body = req.body
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${body.zipcode}&key=c2da078ccba94abaa4aba22e893bebf8&language=en&pretty=1`

    request({ url: url, json: true }, (error, response) => {
        if (error) {
            console.log('unable to connect to api', error)
        } else {
            var data = response.body
            initialVal = Object.values(data.results[0].geometry)
            let output = [initialVal[0], initialVal[1]] = [initialVal[1], initialVal[0]];
            let origin = { type: "Point", coordinates: output }
            const user = new User({
                name: body.name,
                email: body.email,
                password: body.password,
                phone: body.phone,
                image: body.image,
                zipcode: body.zipcode,
                location: origin,
                address: body.address
            });
            // res.json(user)
            user.save((err, user) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                        //error: 'Email is taken'
                    });
                }
                user.salt = undefined;
                user.hashed_password = undefined;
                res.json({
                    user
                });
            });
        }
    })
};

exports.signin = (req, res) => {
    // find the user based on email
    const { email, password } = req.body;
    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please signup'
            });
        }
        // if user is found make sure the email and password match
        // create authenticate method in user model
        if (!user.authenticate(password)) {
            return res.status(401).json({
                error: 'Email and password dont match'
            });
        }
        // generate a signed token with user id and secret
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        // persist the token as 't' in cookie with expiry date
        res.cookie('t', token, { expire: new Date() + 9999, httpOnly: true });
        // return response with user and token to frontend client
        const { _id, name, email, image, phone, zipcode, location } = user;
        return res.json({ token, user: { _id, email, name, image, phone, zipcode, location } });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('t');
    res.json({ message: 'Signout success' });
};

exports.authorization = (req, res, next) => {
    const token = req.query.token;
    console.log('token', token)
    if (!token) {
        console.log("error: @Token was Obsent in Query Params. for updating pass Token")
      return res.sendStatus(403)
    }
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = data._id;
      return next();
    } catch {
      return res.sendStatus(403);
    }
  };





