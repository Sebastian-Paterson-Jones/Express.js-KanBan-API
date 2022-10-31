const express = require('express');
const router = express.Router();
const Card = require('../models/card');
const Board = require("../models/board");
const User = require('../models/user');
const role = require('../utils/role');
const checkAuth =  require('../utils/check-auth');
const jwt = require("jsonwebtoken");

// check user accessibility
const userAccessible = (ownerOnly = true) => {
    return (req, res, next) => {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.JWT_KEY);
        const userId = decodedToken.userId;

        if(decodedToken.userRole === role.User) {
            Card.findById(req.params.id).then(card => {
                if(card) {
                    const board = card.board;
                    Board.findById(board).then(board => {
                        if (board) {
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
                            res.status(404).json({message: 'Board not found'});
                        }
                    }).catch(err => {
                        res.status(500).json({message: 'Internal error occurred'});
                        console.error(err);
                    });
                } else {
                    res.status(404).json({message: 'Card not found'});
                }
            }).catch(err => {
                res.status(500).json({message: 'Internal error occurred'});
                console.error(err);
            });
        } else {
            next();
        }
    }
}

router.post('/create-todo', checkAuth([role.User, role.Developer, role.Admin]), (req, res) => {
    const card = new Card({
        title: req.body.title,
        description: req.body.description,
        board: req.body.board
    });

    card.save()
        .then(result => {
            Board.updateOne({_id: req.body.board}, {$push: {todoCards: result._id}}).then(updateResult => {
                res.status(201).json({
                    message: 'Card created',
                    result: result
                });
            }).catch(error => {
                console.error(error);
                res.status(500).json({message: 'Creating card failed'});
            });
        }).catch(err => {
        res.status(500).json({
            message: "Creating card failed"
        });
    });
});

router.post('/create-doing', checkAuth([role.User, role.Developer, role.Admin]), (req, res) => {
    const card = new Card({
        title: req.body.title,
        description: req.body.description,
        board: req.body.board
    });

    card.save()
        .then(result => {
            Board.updateOne({_id: req.body.board}, {$push: {doingCards: result._id}}).then(updateResult => {
                res.status(201).json({
                    message: 'Card created',
                    result: result
                });
            }).catch(error => {
                console.error(error);
                res.status(500).json({message: 'Creating card failed'});
            });
        }).catch(err => {
        res.status(500).json({
            message: "Creating card failed"
        });
    });
});

router.post('/create-done', checkAuth([role.User, role.Developer, role.Admin]), (req, res) => {
    const card = new Card({
        title: req.body.title,
        description: req.body.description,
        board: req.body.board
    });

    card.save()
        .then(result => {
            Board.updateOne({_id: req.body.board}, {$push: {doneCards: result._id}}).then(updateResult => {
                res.status(201).json({
                    message: 'Card created',
                    result: result
                });
            }).catch(error => {
                console.error(error);
                res.status(500).json({message: 'Creating card failed'});
            });
        }).catch(err => {
        res.status(500).json({
            message: "Creating card failed"
        });
    });
});

router.put('/update/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    const card = {
        title: req.body.title,
        description: req.body.description,
        board: req.body.board
    }

    Card.updateOne({_id: req.params.id}, card).then(result => {
        res.status(200).json({
            message: 'Update successful',
            result: result
        });
    }).catch(err => {
        res.status(500).json({
            message: "Updating card failed"
        });
    });
});

router.get('/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).populate('members', '-password').exec().then(card => {
        if(card) {
            res.status(200).json(card);
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Fetching card failed"
        });
    });
});

router.get('/', checkAuth([role.Developer, role.Admin]), (req, res) => {
    Card.find().populate('members', '-password').exec().then(cards => {
        res.status(200).json(cards);
    }).catch(err => {
        res.status(500).json({
            message: "Fetching cards failed"
        });
    });
});

router.delete('/:id', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.deleteOne({_id: req.params.id}).then(result => {
        res.status(200).json({
            message: 'Card deleted',
            result: result
        });
    }).catch(err => {
        res.status(500).json({
            message: "Deleting card failed"
        });
    });
});

router.put('/:id/move-to-todo', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).then(card => {
        if(card) {
            const board = card.board;
            Board.findById(board).then(board => {
                if(board) {
                    board.todoCards.push(card._id);
                    board.doingCards.pull(card._id);
                    board.doneCards.pull(card._id);
                    board.save().then(result => {
                        res.status(200).json({
                            message: 'Card moved to todo',
                            result: result
                        });
                    }).catch(err => {
                        res.status(500).json({
                            message: "Moving card to todo failed"
                        });
                    });
                } else {
                    res.status(404).json({message: 'Board not found'});
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Moving card to todo failed"
                });
            });
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Moving card to todo failed"
        });
    });
});

router.put('/:id/move-to-doing', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).then(card => {
        if(card) {
            const board = card.board;
            Board.findById(board).then(board => {
                if(board) {
                    board.todoCards.pull(card._id);
                    board.doingCards.push(card._id);
                    board.doneCards.pull(card._id);
                    board.save().then(result => {
                        res.status(200).json({
                            message: 'Card moved to doing',
                            result: result
                        });
                    }).catch(err => {
                        res.status(500).json({
                            message: "Moving card to doing failed"
                        });
                    });
                } else {
                    res.status(404).json({message: 'Board not found'});
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Moving card to doing failed"
                });
            });
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Moving card to doing failed"
        });
    });
});

router.put('/:id/move-to-done', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).then(card => {
        if(card) {
            const board = card.board;
            Board.findById(board).then(board => {
                if(board) {
                    board.todoCards.pull(card._id);
                    board.doingCards.pull(card._id);
                    board.doneCards.push(card._id);
                    board.save().then(result => {
                        res.status(200).json({
                            message: 'Card moved to done',
                            result: result
                        });
                    }).catch(err => {
                        res.status(500).json({
                            message: "Moving card to done failed"
                        });
                    });
                } else {
                    res.status(404).json({message: 'Board not found'});
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Moving card to done failed"
                });
            });
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Moving card to done failed"
        });
    });
});

router.put('/:id/add-member', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).then(card => {
        if(card) {
            const member = req.body.member;
            User.findById(member).then(user => {
                if(user) {
                    card.members.push(member);
                    card.save().then(result => {
                        res.status(200).json({
                            message: 'Member added to card',
                            result: result
                        });
                    }).catch(err => {
                        res.status(500).json({
                            message: "Adding member to card failed"
                        });
                    });
                } else {
                    res.status(404).json({message: 'User not found'});
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Adding member to card failed"
                });
            });
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Adding member to card failed"
        });
    });
});

router.put('/:id/remove-member', [checkAuth([role.User, role.Developer, role.Admin]), userAccessible(false)], (req, res) => {
    Card.findById(req.params.id).then(card => {
        if(card) {
            const member = req.body.member;
            User.findById(member).then(user => {
                if(user) {
                    card.members.pull(member);
                    card.save().then(result => {
                        res.status(200).json({
                            message: 'Member removed from card',
                            result: result
                        });
                    }).catch(err => {
                        res.status(500).json({
                            message: "Removing member from card failed"
                        });
                    });
                } else {
                    res.status(404).json({message: 'User not found'});
                }
            }).catch(err => {
                res.status(500).json({
                    message: "Removing member from card failed"
                });
            });
        } else {
            res.status(404).json({message: 'Card not found'});
        }
    }).catch(err => {
        res.status(500).json({
            message: "Removing member from card failed"
        });
    });
});

module.exports = router;
