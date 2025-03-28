const db = require("../db");
const randomstring = require("randomstring");
const otpCache = {};
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function generateOTP() {
  return randomstring.generate({ length: 6, charset: "numeric" });
}

// ฟังก์ชันสำหรับการส่งอีเมลพร้อม HTML
function sendEmail(email, htmlContent, subject) {
  return new Promise(async (resolve, reject) => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "tapakornaimaugsorn@gmail.com", // อีเมลผู้ส่ง
          pass: "dvdfsctfwusthcro", // App Password
        },
      });

      const options = {
        from: "tapakornaimaugsorn@gmail.com",
        to: email, // ผู้รับ
        subject: subject,
        html: htmlContent, // เนื้อหาอีเมลในรูปแบบ HTML
      };

      await transporter.sendMail(options);
      console.log("Email sent successfully to", email);
      resolve(); // ส่งสำเร็จ
    } catch (error) {
      console.error("Failed to send email:", error);
      reject(new Error("Failed to send email")); // ส่งไม่สำเร็จ
    }
  });
}

function verifyOTP(email, otp, otpCache) {
  // Check if email exists in the cache
  if (!otpCache.hasOwnProperty(email)) {
    return {
      success: false,
      status: 400,
      message: "Your OTP has expired.",
    };
  }

  // Check if OTP matches the one stored in the cache
  if (otpCache[email] === otp.trim()) {
    // Remove OTP from cache after successful verification
    delete otpCache[email];
    return {
      success: true,
      status: 200,
      message: "OTP verified",
    };
  } else {
    return {
      success: false,
      status: 401,
      message: "Invalid OTP",
    };
  }
}

exports.sendOTP = async function (req, res) {
  try {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const otp = generateOTP();
    otpCache[email] = otp;

    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const checkEmail = await db.query(
      "SELECT email FROM users WHERE LOWER(email) = $1",
      [lowerCaseEmail]
    );
    const checkUsername = await db.query(
      "SELECT username FROM users WHERE LOWER(username) = $1",
      [lowerCaseUsername]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (checkUsername.rows.length > 0) {
      return res.status(401).json({ message: "Username already exists" });
    }

    // เรียกฟังก์ชัน sendEmail พร้อมส่ง otp
    const subject = "OTP for verification";
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 400px; margin: auto; border: 1px solid #ddd;">
          <h1 style="color: #4CAF50;">Your OTP Code</h1>
          <p style="font-size: 16px; color: #555;">Use the OTP below to complete your verification.</p>
          <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #777;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
          <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #aaa;">If you did not request this, please ignore this email.</p>
        </div>
      `;
    await sendEmail(email, htmlContent, subject);

    res.cookie("otpCache", otpCache, { maxAge: 300000, httpOnly: true });
    res.status(200).json({ message: "OTP Email sent successfully" });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ message: "Failed to send OTP", error });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, otp } = req.body;

    const lowerCaseEmail = email.toLowerCase();
    const lowerCaseUsername = username.toLowerCase();

    // ตรวจสอบ OTP
    const result = verifyOTP(email, otp, otpCache);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    // ตรวจสอบว่า email และ username มีอยู่ในฐานข้อมูลหรือไม่
    const checkEmail = await db.query(
      "SELECT email FROM users WHERE LOWER(email) = $1",
      [lowerCaseEmail]
    );

    const checkUsername = await db.query(
      "SELECT username FROM users WHERE LOWER(username) = $1",
      [lowerCaseUsername]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (checkUsername.rows.length > 0) {
      return res.status(401).json({ message: "Username already exists" });
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // เพิ่มผู้ใช้ใหม่ลงในฐานข้อมูล
    const query =
      "INSERT INTO users (email, username, password,role,user_profile) VALUES ($1, $2, $3,$4,$5) RETURNING *";

    const values = [
      lowerCaseEmail,
      lowerCaseUsername,
      hashedPassword,
      "user",
      "https://i.pinimg.com/1200x/2c/47/d5/2c47d5dd5b532f83bb55c4cd6f5bd1ef.jpg",
    ];
    const newUser = await db.query(query, values);

    // ส่งผลลัพธ์กลับไปยังผู้ใช้
    res.status(201).json({
      message: "User registered successfully",
      user: {
        email: newUser.rows[0].email,
        username: newUser.rows[0].username,
      },
    });

    console.log("User registered successfully:", newUser.rows[0]);
  } catch (error) {
    // ดักจับข้อผิดพลาดและส่ง response
    console.error("Error during registration:", error);

    // ส่งข้อความข้อผิดพลาดทั่วไป
    res.status(500).json({
      message: "An error occurred during registration",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    // ตรวจสอบว่า email และ password ถูกส่งมาหรือไม่
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    // ค้นหาผู้ใช้จากฐานข้อมูล
    const userResult = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = $1",
      [lowerCaseEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const createdAt = new Date(user.created_at);
    const thaiYear = createdAt.getFullYear() + 543; // เพิ่ม 543 ปีเพื่อให้เป็นปีพ.ศ.
    const formattedDate = `${("0" + createdAt.getDate()).slice(-2)}/${(
      "0" +
      (createdAt.getMonth() + 1)
    ).slice(-2)}/${thaiYear}`;

    const token = jwt.sign(
      {
        id: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        user_profile: user.user_profile,
      },
      "jwtsecret",
      { expiresIn: "1h" } // กำหนดอายุของโทเค็น
    );

    // ส่งข้อมูลกลับไปยังผู้ใช้
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        role: user.role,
        user_profile: user.user_profile,
        created_at: user.created_at,
      },
    });

    console.log("User logged in:", user.username);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      message: "An error occurred during login",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    // ตรวจสอบว่าได้ส่งอีเมลมาในคำขอหรือไม่
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // ตรวจสอบว่าผู้ใช้อีเมลนี้มีอยู่ในระบบหรือไม่
    const userResult = await db.query(
      "SELECT * FROM users WHERE LOWER(email) = $1",
      [lowerCaseEmail]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // สร้าง OTP และเก็บไว้ใน otpCache
    const otp = generateOTP();
    otpCache[email] = otp;

    // สร้างเนื้อหาของอีเมลที่จะส่ง
    const subject = "OTP for Password Reset";
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 400px; margin: auto; border: 1px solid #ddd;">
        <h1 style="color: #4CAF50;">Your OTP for Password Reset</h1>
        <p style="font-size: 16px; color: #555;">Use the OTP below to reset your password.</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #333;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #777;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #aaa;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    // ส่ง OTP ไปยังอีเมลผู้ใช้
    await sendEmail(email, htmlContent, subject);

    // ตั้งค่าเวลาในการเก็บ OTP (5 นาที)
    res.cookie("otpCache", otpCache, { maxAge: 300000, httpOnly: true });
    res.status(200).json({ message: "OTP sent to your email successfully" });

    console.log("OTP sent for password reset to:", email);
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({
      message: "An error occurred while processing the forgot password request",
      error: error.message,
    });
  }
};

// สถานะของ OTP
const otpSessions = {};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const result = verifyOTP(email, otp, otpCache);
    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    // เก็บสถานะใน session แทนการใช้ global variable
    otpSessions[email] = { verified: true, timestamp: Date.now() };

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({
      message: "An error occurred while verifying the OTP",
      error: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const lowerCaseEmail = email.toLowerCase();
    // ตรวจสอบ session แทน
    if (!otpSessions[email]?.verified) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updateQuery =
      "UPDATE users SET password = $1 WHERE email = $2 RETURNING *";
    const updatedUserResult = await db.query(updateQuery, [
      hashedPassword,
      lowerCaseEmail,
    ]);

    if (updatedUserResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // ลบ session หลังจาก reset password เสร็จสิ้น
    delete otpSessions[email];

    res.status(200).json({
      message: "Password reset successfully",
      user: {
        email: updatedUserResult.rows[0].email,
        username: updatedUserResult.rows[0].username,
      },
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({
      message: "An error occurred while resetting the password",
      error: error.message,
    });
  }
};
