const jwt = require('jsonwebtoken')
require('dotenv').config()

const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers['authorization']
    if(!authHeader){
        return res.status(401).json({
            success: false,
            message: 'Unauthenticated User'
        })
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(
        token, 
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err){
                return res.status(401).json({
                    success: false,
                    message: 'Token expired'
                })
            }

            req.user_id = decoded.user_info.user_id
            req.user_email = decoded.user_info.user_email 
            
            next()
        }
    )
}

module.exports = verifyJWT