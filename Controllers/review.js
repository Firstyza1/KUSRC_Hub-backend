const db = require("../db");

exports.requestSubject = async (req, res) => {
  try {
    const { user_id, username, subject_id, subject_thai, subject_eng, credit, category_id } = req.body;

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (!user_id || !username || !subject_id || !subject_thai || !subject_eng || !credit || !category_id) {
      return res.status(400).json({ message: "Please fill out the information completely." });
    }

    // ตรวจสอบว่า user_id มีอยู่ในฐานข้อมูลหรือไม่
    const checkUserID = await db.query("SELECT user_id FROM users WHERE user_id = $1", [user_id]);
    if (checkUserID.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    // ตรวจสอบว่า category_id อยู่ในช่วงที่ถูกต้องหรือไม่
    if (category_id < 0 || category_id > 5) {
      return res.status(400).json({ message: "Category not found" });
    }

    // บันทึกข้อมูลลงในตาราง request
    const insertQuery = `
      INSERT INTO request (user_id, username, subject_id, subject_thai, subject_eng, credit, category_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`;
    const currentTime = new Date();
    const values = [user_id, username, subject_id, subject_thai, subject_eng, credit, category_id, currentTime, currentTime];

    const result = await db.query(insertQuery, values);

    res.status(201).json({
      message: "Request submitted successfully",
      request: result.rows[0],
    });

    console.log("Request submitted:", result.rows[0]);
  } catch (error) {
    console.error("Error in requestSubject:", error);
    res.status(500).json({
      message: "An error occurred while submitting the request",
      error: error.message,
    });
  }
};

exports.getSubject = async (req, res) => {
  try {
    // ดึงข้อมูลทั้งหมดจากตาราง subject
    const query = `SELECT t1.subject_id, t1.subject_thai, t1.subject_eng, t1.credit, t2.category_name, t1.created_at, t1.updated_at FROM subject t1,category t2 where t1.category_id = t2.category_id`;
    const result = await db.query(query);

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      subjects: result.rows, // ข้อมูลทั้งหมดในตาราง subject
    });
  } catch (error) {
    console.error("Error retrieving subjects:", error);
    res.status(500).json({
      message: "An error occurred while retrieving subjects",
      error: error.message,
    });
  }
};