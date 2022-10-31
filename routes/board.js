const express = require('express');
const router = express.Router();
const Board = require('../models/board');
const role = require('../utils/role.js');
const checkAuth =  require('../utils/check-auth.js');
const jwt = require("jsonwebtoken");

// check user accessibility
const userAccessible = (ownerOnly = true) => {
    return (req, res, next) => {
        Board.findById(req.params.id).then(board => {
            if (board) {
                const token = req.headers.authorization.split(' ')[1];
                const decodedToken = jwt.verify(token, process.env.JWT_KEY);
                const userId = decodedToken.userId;

                if(decodedToken.userRole === role.User) {
                    if(ownerOnly) {
                        if (board.owner.toString() === userId) {
                            next();
                        } else {
                            res.status(401).json({message: 'Unauthorized'});
                        }
                    } else {
                        if(board.owner.toString() === userId || board.members.includes(userId)) {
                            next();
                        } else {
                            res.status(401).json({message: 'Unauthorized'});
                        }
                    }
                } else {
                    next();
                }
            } else {
                res.status(404).json({message: 'Board not found'});
            }
        }).catch(err => {
            res.status(500).json({message: 'Internal error occurred'});
        });
    }
}

router.post('/create', checkAuth([role.User, role.Developer, role.Admin]), (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    const userId = decodedToken.userId;

    const board = new Board({
        name: req.body.name,
        description: req.body.description,
        owner: userId
    });
    board.save()
        .then(result => {
            res.status(201).json({
                message: 'Board created',
                result: result
            });
        }).catch(err => {
        res.status(500).json({
            message: "Creating board failed"
        });
    });
});

router.put('/update/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    const board = {
        name: req.body.name,
        description: req.body.description
    };
    Board.updateOne({_id: req.params.id}, board).then(result => {
        res.status(200).json({message: 'Update successful', result: result});
    }).catch(err => {
        res.status(500).json({message: 'Internal error occurred'});
    });
});

router.get('/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Board.findById(req.params.id).populate(["todoCards", "doingCards", "doneCards"]).populate("members", "-password").exec().then(board => {
        if (board) {
            res.status(200).json(board);
        } else {
            res.status(404).json({message: 'Board not found'});
        }
    }).catch(err => {
        console.error(err);
        res.status(500).json({
            message: "Fetching board failed"
        });
    });
});

router.get('/', checkAuth([role.Developer, role.Admin]), (req, res) => {
    Board.find().populate(["todoCards", "doingCards", "doneCards"]).populate("members", "-password").exec().then(boards => {
        res.status(200).json(boards);
    }).catch(err => {
        res.status(500).json({
            message: "Fetching boards failed"
        });
    });
});

router.delete('/delete/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(true)], (req, res) => {
    Board.deleteOne({_id: req.params.id}).then(result => {
        res.status(200).json({message: 'Delete successful'});
    }).catch(err => {
        res.status(500).json({
            message: "Deleting board failed"
        });
    });
});

router.put('/:id/add-user/:userId', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible()], (req, res) => {
    Board.updateOne({_id: req.params.id}, {$push: {members: req.params.userId}}).then(result => {
        res.status(200).json({message: 'Update successful', result: result});
    }).catch(error => {
        console.error(error);
        res.status(500).json({message: 'Updating board failed'});
    });
});

router.put('/:id/remove-user/:userId', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible()], (req, res) => {
    Board.updateOne({_id: req.params.id}, {$pull: {members: req.params.userId}}).then(result => {
        res.status(200).json({message: 'Update successful', result: result});
    }).catch(error => {
        console.error(error);
        res.status(500).json({message: 'Updating board failed'});
    });
});

module.exports = router;
