const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // بصيغة Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: "authenitication faild **Access denied. Token missing**." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
        req.user = decoded; // يحتوي على { userId, email }
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
}

module.exports = authMiddleware;
