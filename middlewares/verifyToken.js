const jwt = require('jsonwebtoken')

const JWT_SECRET = '51f556a15bb292a48d9a0a86b5566608991ec2a55044c19fbac12d6ed52afa2897ecd589e41a6883a30a6e7ffe1e92418a315851b36bcd22d2adf273a920607afa592bddc63a6a891f23996e62cfb52d04fdd7ba401b55538cb2687eb63de65b65c4efbb4eeb7259646d95adc81bdf319c00b9b56f8bd3e19868fe4484cdb7f4be4e7aa73b3d00a22968c142211b87be5ea7dea26d339d779ac3fcdbd714d35c57245466129df34a518ca3581b5c51a1275dd50778440a152b8958125f4acd65a6ce484f66323a06c03fe8bcc62c382101f66a1608e787e228b3a657ee63fbbe9a154747f39f7dcdf5e945cb1d342bbeb0da04f860c0a2f4ed67f45a778b19b5'

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Brak tokenu autoryzacyjnego' })
    }
    
    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        console.log(decoded)
        req.user = decoded
        next()
    } catch (err) {
        return res.status(403).json({ error: 'Nieprawidłowy lub wygasły token' })
    }
}

module.exports = verifyToken