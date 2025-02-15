const db = require("../db");
const cloudinary = require("../cloudinary");
const fs = require("fs");
const path = require("path");
exports.userProfile = async (req, res) => {
  try {
    const { user_id } = req.params; // รับ user_id จาก URL parameter

    // ตรวจสอบว่ามีการส่ง user_id มาหรือไม่
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
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
    console.error("Error retrieving user profile:", error);
    res.status(500).json({
      message: "An error occurred while retrieving user profile",
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
        .json({ message: "User not found or no changes made" });
    }

    res.status(200).json({
      message: "User profile updated successfully",
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "An error occurred while updating user profile",
      error: error.message,
    });
  }
};
