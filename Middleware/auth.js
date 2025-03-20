const jwt = require('jsonwebtoken')
exports.auth = async (req, res, next) => {
    try {
        //code
        const token = req.headers["authtoken"]
        if (!token) {
            return res.status(401).send('No token')
        }
        const decoded = jwt.verify(token, 'jwtsecret')
        req.user = decoded
        
        next();
    } catch (err) {
        // err
        console.log(err)
        res.send('Token Invalid').status(500)
    }
}

exports.adminAuth = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};

exports.isOwnerOrAdmin = (req, res, next) => {
    const { user_id } = req.params; // รับ user_id จาก URL
    const loggedInUser = req.user; // ดึงข้อมูล user จาก token ที่ auth middleware แนบให้

    // Log ค่าที่ได้รับมา เพื่อตรวจสอบความถูกต้อง
    console.log("🔍 loggedInUser:", loggedInUser);
    console.log("🔍 user_id from params:", user_id);

    // เช็คว่ามีข้อมูล user หรือไม่
    if (!loggedInUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // ตรวจสอบว่าค่า user_id ที่ถูกส่งมานั้นเป็น string หรือ number แล้วแปลงให้ตรงกัน
    if (loggedInUser.id === parseInt(user_id) || loggedInUser.role === "admin") {
        return next();
    }

    return res.status(403).json({ message: "Access denied" });
};
