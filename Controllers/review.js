const db = require("../db");

exports.requestSubject = async (req, res) => {
  try {
    const { subject_id, subject_thai, subject_eng, credit, category_id } =
      req.body;

    // ตรวจสอบว่ามีข้อมูลครบถ้วนหรือไม่
    if (
      !subject_id ||
      !subject_thai ||
      !subject_eng ||
      !credit ||
      !category_id
    ) {
      return res
        .status(400)
        .json({ message: "Please fill out the information completely." });
    }

    // ตรวจสอบว่า category_id อยู่ในช่วงที่ถูกต้องหรือไม่
    if (category_id < 0 || category_id > 5) {
      return res.status(400).json({ message: "Category not found" });
    }

    // บันทึกข้อมูลลงในตาราง request
    const insertQuery = `
      INSERT INTO subject (subject_id, subject_thai, subject_eng, credit, category_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const currentTime = new Date();
    const values = [
      subject_id,
      subject_thai,
      subject_eng,
      credit,
      category_id,
      currentTime,
      currentTime,
    ];

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

exports.deleteSubject = async (req, res) => {
  const { subject_id } = req.params; // รับ subject_id จาก URL

  if (!subject_id) {
    return res.status(400).json({ error: "ต้องระบุรหัสวิชา" });
  }

  try {
    // ✅ ตรวจสอบว่ารายวิชามีอยู่จริงหรือไม่
    const checkQuery = "SELECT * FROM subject WHERE subject_id = $1;";
    const checkResult = await db.query(checkQuery, [subject_id]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบรายวิชาที่ต้องการลบ" });
    }

    // ✅ ลบรายวิชา
    const deleteQuery =
      "DELETE FROM subject WHERE subject_id = $1 RETURNING *;";
    const result = await db.query(deleteQuery, [subject_id]);

    res.json({ message: "ลบรายวิชาสำเร็จ", deletedSubject: result.rows[0] });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลบรายวิชา:", err);
    res
      .status(500)
      .json({ error: "ไม่สามารถลบรายวิชาได้", details: err.message });
  }
};

exports.getSubjectById = async (req, res) => {
  const { subject_id } = req.params; // รับ subject_id จาก URL

  try {
    // ✅ ดึงข้อมูลเฉพาะรายวิชาที่ต้องการ
    const query = `
          SELECT t1.subject_id, t1.subject_thai, t1.subject_eng, t1.credit, 
                 t2.category_name, t1.created_at, t1.updated_at 
          FROM subject t1
          JOIN category t2 ON t1.category_id = t2.category_id
          WHERE t1.subject_id = $1;
      `;
    const result = await db.query(query, [subject_id]);

    // ✅ ตรวจสอบว่าพบข้อมูลหรือไม่
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบรายวิชานี้" });
    }

    // ✅ ส่งข้อมูลกลับ
    res.status(200).json({ subject: result.rows[0] });
  } catch (error) {
    console.error("Error retrieving subject:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา",
      details: error.message,
    });
  }
};

exports.updateSubject = async (req, res) => {
  const { subject_id } = req.params; // รับ subject_id จาก URL
  const { new_subject_id, subject_thai, subject_eng, credit, category_id } =
    req.body; // รับค่าที่ต้องการอัปเดตจาก body

  try {
    // ✅ ดึงข้อมูลเดิมของรายวิชาจากฐานข้อมูล
    const checkQuery = "SELECT * FROM subject WHERE subject_id = $1;";
    const checkResult = await db.query(checkQuery, [subject_id]);

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบรายวิชาที่ต้องการแก้ไข" });
    }

    // ✅ ใช้ข้อมูลเดิมถ้าผู้ใช้ไม่ได้ส่งค่ามาอัปเดต
    const existingData = checkResult.rows[0];

    const finalSubjectId = new_subject_id || existingData.subject_id;
    const finalSubjectThai = subject_thai || existingData.subject_thai;
    const finalSubjectEng = subject_eng || existingData.subject_eng;
    const finalCredit = credit !== undefined ? credit : existingData.credit;
    const finalCategoryId =
      category_id !== undefined ? category_id : existingData.category_id;

    // ✅ ตรวจสอบว่า new_subject_id ซ้ำกับวิชาอื่นหรือไม่ (ถ้ามีการเปลี่ยน subject_id)
    if (subject_id !== finalSubjectId) {
      const checkDuplicateQuery =
        "SELECT * FROM subject WHERE subject_id = $1;";
      const duplicateResult = await db.query(checkDuplicateQuery, [
        finalSubjectId,
      ]);

      if (duplicateResult.rowCount > 0) {
        return res
          .status(400)
          .json({ error: "subject_id นี้มีอยู่แล้วในระบบ" });
      }
    }

    // ✅ อัปเดตข้อมูลรายวิชา
    const updateQuery = `
          UPDATE subject 
          SET subject_id = $1, subject_thai = $2, subject_eng = $3, 
              credit = $4, category_id = $5, updated_at = NOW()
          WHERE subject_id = $6 
          RETURNING *;
      `;
    const result = await db.query(updateQuery, [
      finalSubjectId,
      finalSubjectThai,
      finalSubjectEng,
      finalCredit,
      finalCategoryId,
      subject_id,
    ]);

    res.json({ message: "แก้ไขรายวิชาสำเร็จ", updatedSubject: result.rows[0] });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการแก้ไขรายวิชา:", err);
    res
      .status(500)
      .json({ error: "ไม่สามารถแก้ไขรายวิชาได้", details: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    // const { user_id } = req.query;

    // เช็คข้อมูลว่า user_id ส่งมาหรือไม่
    // if (!user_id) {
    //   return res.status(400).json({ message: "user_id is required" });
    // }

    // ตรวจสอบว่ารีวิวที่ต้องการลบมีอยู่ในฐานข้อมูลหรือไม่
    const review = await db.query("SELECT * FROM review WHERE review_id = $1", [
      review_id,
    ]);

    if (review.rowCount === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ตรวจสอบว่า user_id ตรงกับเจ้าของรีวิวหรือไม่
    // if (review.rows[0].user_id !== user_id) {
    //   return res.status(403).json({
    //     message: "Unauthorized: You can only delete your own reviews",
    //   });
    // }

    // ลบรีวิว
    const result = await db.query(
      "DELETE FROM review WHERE review_id = $1 RETURNING *",
      [review_id]
    );
    res.json({
      message: "Review deleted successfully",
      review: result.rows[0],
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: `An error occurred while processing your request: ${error.message},`
    });
  }
};
