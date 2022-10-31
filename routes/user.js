require('dotenv').config();
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const role = require('../utils/role.js');
const checkAuth =  require('../utils/check-auth.js');
const hsts = require('../utils/hsts');

router.post('/register', hsts, (req, res) => {
    bcrypt.hash(req.body.password, 10).then(hash => {
        const user = new User(
            {
                email: req.body.email,
                password: hash,
                role: role.User
            }
        );
        user.save()
            .then(result => {
                res.status(201).json({
                    message: 'User created',
                    result: result
                });
            }).catch(err => {
            res.status(500).json({
                message: "Creating user failed"
            });
        });
    });
});

router.post('/login', hsts, (req, res) => {
    let fetchedUser;
    User.findOne({email: req.body.email}).then(user => {
        if (user===null) {
            return res.status(401).json({
                message: 'Auth failed'
            });
        }
        fetchedUser = user;
        return bcrypt.compare(req.body.password, user.password).then(result => {
            if (!result) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }

            const token = jwt.sign(
                {
                    userEmail: fetchedUser.email,
                    userId: fetchedUser._id,
                    userRole: fetchedUser.role
                }, process.env.JWT_KEY, {expiresIn: process.env.JWT_EXPIRY});

            res.status(200).json({
                message: 'Auth successful',
                token: token,
                user: {
                    email: fetchedUser.email,
                    role: fetchedUser.role,
                    _id: fetchedUser._id
                }
            });
        }).catch(err => {
            console.error(err)
            res.status(500).json({
                message: 'An unexpected error occurred, please retry'
            });
        });
    })
});

router.put('/update/:id', checkAuth([role.User, role.Admin, role.Developer]), (req, res) => {

    if(req.body.password){
        bcrypt.hash(req.body.password, 10).then(hash => {
            const user = {
                email: req.body.email,
                password: hash,
                role: req.body.role
            }
            User.updateOne({_id: req.params.id}, user).then(result => {
                res.status(200).json({message: 'Update successful', result: result});
            }).catch(err => {
                res.status(500).json({message: 'Update failed'});
                console.error(err)
            });
        });
    } else {
        const user ={
            email: req.body.email,
            role: req.body.role
        }
        User.updateOne({_id: req.params.id}, user).then(result => {
            res.status(200).json({message: 'Update successful', result: result});
        }).catch(err => {
            res.status(500).json({message: "Update failed"});
            console.error(err);
        });
    }
});

router.delete('/delete/:id', checkAuth([role.Admin, role.Developer]), (req, res) => {
    User.deleteOne({_id: req.params.id})
        .then(result => {
            res.status(200).json({message: 'Delete successful'});
        }).catch(err => {
            res.status(500).json({message: 'Delete failed'});
            console.error(err);
        });
});

router.get('/:id', checkAuth([role.Admin, role.Developer]), (req, res) => {
    User.findById(req.params.id).select("-password")
        .then(user => {
            if (user) {
                res.status(200).json(user);
            } else {
                res.status(404).json({message: 'User not found'});
            }
        }).catch(err => {
            res.status(500).json({message: 'Fetching user failed'});
            console.error(err);
        });
});

router.get('/', checkAuth([role.User, role.Admin, role.Developer]), (req, res) => {
    User.find().select("-password")
        .then(users => {
            res.status(200).json(users);
        }).catch(err => {
            res.status(500).json({message: 'Fetching users failed'});
            console.error(err);
        });
});

module.exports = router;
