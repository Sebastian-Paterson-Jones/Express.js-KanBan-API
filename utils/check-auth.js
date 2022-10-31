require('dotenv').config();
const jwt = require('jsonwebtoken');

const checkAuth = (userRoles = []) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decodedToken = jwt.verify(token, process.env.JWT_KEY);
            const userRole = decodedToken.userRole;
            if (userRoles.length && !userRoles.includes(userRole)) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }
            next();
        } catch (error) {
            res.status(401).json({
                message: 'Auth failed'
            });
        }
    }
}

module.exports = checkAuth;
