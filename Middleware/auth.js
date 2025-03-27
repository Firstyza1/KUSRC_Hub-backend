const jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {
  try {
    // รับโทเค็นจาก Header
    const token = req.headers["authtoken"];

    // ตรวจสอบว่ามีโทเค็นหรือไม่
    if (!token) {
      return res.status(401).send("No token provided");
    }

    // ตรวจสอบว่าโทเค็นขึ้นต้นด้วย "Bearer " หรือไม่
    if (!token.startsWith("Bearer ")) {
      return res.status(401).send("Invalid token format");
    }

    // แยกโทเค็นออกจาก "Bearer "
    const tokenWithoutBearer = token.split(" ")[1];

    // ตรวจสอบโทเค็น
    const decoded = jwt.verify(tokenWithoutBearer, "jwtsecret");
    req.user = decoded; // เก็บข้อมูลผู้ใช้จากโทเค็นไว้ใน req.user

    next(); // ไปยังขั้นตอนต่อไป
  } catch (err) {
    console.log(err);

    // ส่งข้อความผิดพลาดกลับไปยัง Client
    if (err.name === "JsonWebTokenError") {
      return res.status(401).send("Invalid token");
    } else if (err.name === "TokenExpiredError") {
      return res.status(401).send("Token expired");
    } else {
      return res.status(500).send("Internal server error");
    }
  }
};

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