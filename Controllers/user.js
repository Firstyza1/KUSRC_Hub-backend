const db = require("../db");
const cloudinary = require("../cloudinary");
const fs = require("fs");
const path = require("path");
const { error } = require("console");
const bcrypt = require("bcryptjs");

exports.userProfile = async (req, res) => {
  try {
    const { user_id } = req.params; // รับ user_id จาก URL parameter

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!user_id) {
      return res.status(400).json({ message: "ต้องระบุรหัสผู้ใช้" });
    }

    // ดึงข้อมูลผู้ใช้จากตาราง users
    const query = `
      SELECT user_id, email, username, user_profile, created_at, updated_at 
      FROM users 
      WHERE user_id = $1
    `;
    const result = await db.query(query, [user_id]);

    // ตรวจสอบว่าพบข้อมูลหรือไม่
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      user: result.rows[0], // คืนค่าข้อมูลผู้ใช้
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเรียกข้อมูลโปรไฟล์ผู้ใช้:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะเรียกข้อมูลโปรไฟล์ผู้ใช้",
      error: error.message,
    });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { username } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // ตรวจสอบว่า username ซ้ำหรือไม่
    if (username) {
      const usernameCheckQuery = `SELECT username FROM users WHERE username = $1 AND user_id <> $2`;
      const usernameCheckResult = await db.query(usernameCheckQuery, [
        username,
        user_id,
      ]);

      if (usernameCheckResult.rows.length > 0) {
        return res
          .status(400)
          .json({ message: "ชื่อผู้ใช้นี้มีคนใช้เเล้ว โปรดลองชื่ออื่น" });
      }
    }

    // ดึงข้อมูลรูปโปรไฟล์เก่าของผู้ใช้
    const oldProfileQuery = `SELECT user_profile FROM users WHERE user_id = $1`;
    const oldProfileResult = await db.query(oldProfileQuery, [user_id]);

    let oldProfileImageUrl = oldProfileResult.rows[0]?.user_profile || null;
    let profileImageUrl = oldProfileImageUrl;

    if (req.file) {
      // ตรวจสอบประเภทไฟล์ (อนุญาตเฉพาะ JPG และ PNG)
      if (!["image/jpeg", "image/png"].includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path); // ลบไฟล์ที่ไม่ตรงเงื่อนไขออกจากเซิร์ฟเวอร์
        return res
          .status(400)
          .json({ message: " อนุญาตให้ใช้ภาพJPG หรือ PNG เท่านั้น" });
      }

      // 🔹 ลบรูปเก่าถ้ามี
      if (oldProfileImageUrl) {
        // ดึง `public_id` ของรูปเก่าจาก URL
        const publicId = oldProfileImageUrl.split("/").pop().split(".")[0]; // ดึงค่าจาก URL ที่ Cloudinary ให้มา

        await cloudinary.uploader.destroy(`UserProfile/${publicId}`);
      }

      // 🔹 อัปโหลดรูปใหม่ไปที่ Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "UserProfile",
        upload_preset: "UserProfile",
      });

      profileImageUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // ลบไฟล์ที่อัปโหลดจากเซิร์ฟเวอร์
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updateQuery = `
      UPDATE users 
      SET 
        username = COALESCE($1, username), 
        user_profile = COALESCE($2, user_profile), 
        updated_at = NOW()
      WHERE user_id = $3
      RETURNING user_id, username, user_profile, updated_at;
    `;

    const values = [username || null, profileImageUrl || null, user_id];
    const updateResult = await db.query(updateQuery, values);

    if (updateResult.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบผู้ใช้หรือไม่มีการเปลี่ยนแปลง" });
    }

    res.status(200).json({
      message: "อัปเดตโปรไฟล์ผู้ใช้สำเร็จแล้ว",
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์ผู้ใช้:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะอัปเดตโปรไฟล์ผู้ใช้",
      error: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
    const { user_id } = req.params; // รับ user_id จาก URL

    if(!user_id){
      return res.status(400).json({error: "ต้องระบุรหัสผู้ใช้"})
    }

    // ตรวจสอบว่า user_id เป็นตัวเลขหรือไม่
    const parsedUserId = parseInt(user_id, 10);
    if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: "user_id ต้องเป็นตัวเลข" });
    }

    try {
        // ✅ ตรวจสอบว่าผู้ใช้มีอยู่จริงหรือไม่
        const checkQuery = "SELECT * FROM users WHERE user_id = $1;";
        const checkResult = await db.query(checkQuery, [parsedUserId]);

        if (checkResult.rowCount === 0) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการลบ" });
        }

        // ✅ ลบผู้ใช้
        const deleteQuery = "DELETE FROM users WHERE user_id = $1 RETURNING *;";
        const result = await db.query(deleteQuery, [parsedUserId]);

        res.json({ message: "ลบผู้ใช้สำเร็จ", deletedUser: result.rows[0] });
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการลบผู้ใช้:", err);
        res.status(500).json({ error: "ไม่สามารถลบผู้ใช้ได้", details: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
  try {
    // คิวรีดึงข้อมูลผู้ใช้ทั้งหมด
    const query = `
      SELECT *
      FROM users
    `;
    const result = await db.query(query);

    // // ตรวจสอบว่ามีข้อมูลหรือไม่
    // if (result.rows.length === 0) {
    //   return res.status(404).json({ message: "No users found" });
    // }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      users: result.rows, // คืนค่าข้อมูลผู้ใช้ทั้งหมด
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ทั้งหมด:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะดึงข้อมูลผู้ใช้",
      error: error.message,
    });
  }
};
