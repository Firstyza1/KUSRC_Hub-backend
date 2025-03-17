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

// exports.getSubjectById = async (req, res) => {
//   const { subject_id } = req.params; // รับ subject_id จาก URL

//   try {
//     // ✅ ดึงข้อมูลเฉพาะรายวิชาที่ต้องการ
//     const query = `
//           SELECT t1.subject_id, t1.subject_thai, t1.subject_eng, t1.credit, 
//                  t2.category_name, t1.created_at, t1.updated_at 
//           FROM subject t1
//           JOIN category t2 ON t1.category_id = t2.category_id
//           WHERE t1.subject_id = $1;
//       `;
//     const result = await db.query(query, [subject_id]);

//     // ✅ ตรวจสอบว่าพบข้อมูลหรือไม่
//     if (result.rowCount === 0) {
//       return res.status(404).json({ error: "ไม่พบรายวิชานี้" });
//     }

//     // ✅ ส่งข้อมูลกลับ
//     res.status(200).json({ subject: result.rows[0] });
//   } catch (error) {
//     console.error("Error retrieving subject:", error);
//     res.status(500).json({
//       error: "เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา",
//       details: error.message,
//     });
//   }
// };

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


//เพิ่มของทีน
exports.getSubjectById = async (req, res) => {
  try {
    const { subject_id } = req.params;

    if (!subject_id) {
      console.log("Error: subject_id is required.");
      return res.status(400).json({ message: "subject_id is required." });
    }

    const result = await db.query(
      `SELECT 
        t1.subject_id,
        t1.subject_thai,
        t1.subject_eng,
        t1.credit,
        t2.category_thai,
        ROUND(AVG((COALESCE(t3.score_homework, 0) / 4.0) * 100), 0) AS percent_homework,
        ROUND(AVG((COALESCE(t3.score_content, 0) / 4.0) * 100), 0) AS percent_content,
        ROUND(AVG((COALESCE(t3.score_teach, 0) / 4.0) * 100), 0) AS percent_teach
        FROM 
            subject t1
        LEFT JOIN category t2 ON t1.category_id = t2.category_id
        LEFT JOIN review t3 ON t1.subject_id = t3.subject_id
        WHERE 
            t1.subject_id = $1
        GROUP BY  
            t1.subject_id,
            t1.subject_thai,
            t1.subject_eng,
            t1.credit,
            t2.category_thai;`,
      [subject_id]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ message: "No data found." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "An error occurred while retrieving subjects",
      error: error.message,
    });
  }
};

exports.createReview = async (req, res) => {
  let pdf_path = null;
  try {
    const {
      review_id,
      user_id,
      subject_id,
      review_desc,
      grade,
      score_homework,
      score_content,
      score_teach,
      semester,
      academic_year,
    } = req.body;

    if (req.file) {
      if (req.file.mimetype !== "application/pdf") {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Only PDF files are allowed" });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ message: "File size must not exceed 5MB" });
      }

      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "SummaryFile",
          upload_preset: "SummaryFile",
        });
        fs.unlinkSync(req.file.path);
        pdf_path = result.secure_url;
      } catch (error) {
        fs.unlinkSync(req.file.path);
        return res
          .status(500)
          .json({ message: "File upload error", error: error.message });
      }
    }

    if (
      !user_id ||
      !subject_id ||
      !review_desc ||
      // !grade ||
      !score_homework ||
      !score_content ||
      !score_teach ||
      !semester ||
      !academic_year
    ) {
      return res
        .status(400)
        .json({ message: "Please fill out all the required fields." });
    }

    const checkUserID = await db.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [user_id]
    );
    if (checkUserID.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const currentTime = new Date();
    let reviewQuery;
    let reviewValues;

    if (review_id) {
      reviewQuery = `
        UPDATE review
        SET review_desc = $1, 
            score_homework = $2, 
            score_content = $3,
            score_teach = $4,
            grade = $5,
            semester = $6,
            academic_year = $7,
            updated_at = $8,
            pdf_path = COALESCE($9, pdf_path)
        WHERE review_id = $10
        RETURNING *`;
      reviewValues = [
        review_desc,
        score_homework,
        score_content,
        score_teach,
        grade,
        semester,
        academic_year,
        currentTime,
        pdf_path,
        review_id,
      ];
    } else {
      reviewQuery = `
        INSERT INTO review(user_id, subject_id, review_desc, score_homework, score_content, score_teach, grade, semester, academic_year, pdf_path, created_at)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`;
      reviewValues = [
        user_id,
        subject_id,
        review_desc,
        score_homework,
        score_content,
        score_teach,
        grade,
        semester,
        academic_year,
        pdf_path,
        currentTime,
      ];
    }

    const review = await db.query(reviewQuery, reviewValues);

    if (review.rowCount === 0) {
      return res.status(400).json({ message: "Failed to save review" });
    }

    const statusCode = review_id ? 200 : 201;
    const action = review_id ? "updated" : "inserted";
    res.status(statusCode).json({
      message: `Review ${action} successfully`,
      review: review.rows[0],
    });
  } catch (error) {
    console.error("Error in review:", error);
    res.status(500).json({
      message: "An error occurred while submitting the review",
      error: error.message,
    });
  }
};

exports.getReview = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      semester,
      academic_year,
      includePdf,
      user_id = null,
    } = req.query;
    const offset = (page - 1) * limit;
    const { subject_id } = req.params;

    if (!subject_id) {
      console.log("Error: subject_id is required.");
      return res.status(400).json({ message: "subject_id is required." });
    }

    let query = `
      SELECT 
        t1.review_id,
        t1.user_id,
        t2.user_profile,
        t2.username,
        t1.subject_id,
        t1.review_desc,
        t1.grade,
        t1.semester,
        t1.academic_year,
        t1.pdf_path,
        COUNT(DISTINCT CASE WHEN t3.reaction_type = 'like' THEN t3.reaction_id END) AS like_count,
        COUNT(DISTINCT CASE WHEN t3.reaction_type = 'dislike' THEN t3.reaction_id END) AS dislike_count,
        t1.created_at,
        t1.updated_at,
        ROUND(((t1.score_homework + t1.score_content + t1.score_teach) / 12.0) * 100, 0) AS overall_percentage,
        MAX(CASE WHEN t4.user_id = $2
        AND t4.reaction_type = 'like' THEN 1 ELSE 0 END) AS user_has_liked,
        MAX(CASE WHEN t4.user_id = $2
        AND t4.reaction_type = 'dislike' THEN 1 ELSE 0 END) AS user_has_disliked
      FROM review t1
      INNER JOIN users t2 ON t1.user_id = t2.user_id
      LEFT JOIN review_reaction t3 ON t1.review_id = t3.review_id
      LEFT JOIN review_reaction t4 ON t1.review_id = t4.review_id AND t4.user_id = $2
      WHERE t1.subject_id = $1
    `;

    const queryParams = [subject_id, user_id];

    if (semester) {
      query += ` AND t1.semester = $${queryParams.length + 1}`;
      queryParams.push(semester);
    }

    if (academic_year) {
      query += ` AND t1.academic_year = $${queryParams.length + 1}`;
      queryParams.push(academic_year);
    }

    // เพิ่มเงื่อนไขสำหรับการกรอง pdf_path ถ้า includePdf มีค่าเป็น "true"
    if (includePdf === "true") {
      query += ` AND t1.pdf_path IS NOT NULL AND t1.pdf_path != ''`;
    }

    query += ` GROUP BY 
        t1.review_id,
        t1.user_id,
        t2.user_profile,
        t2.username,
        t1.subject_id,
        t1.review_desc,
        t1.grade,
        t1.semester,
        t1.academic_year,
        t1.pdf_path,
        t1.created_at,
        t1.updated_at,
        t1.score_homework,
        t1.score_content,
        t1.score_teach
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await db.query(query, queryParams);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(200).json([]);
      // res.status(404).json({ message: "No reviews found for this subject." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "An error occurred while retrieving reviews.",
      error: error.message,
    });
  }
};

exports.reviewReactions = async (req, res) => {
  try {
    const { user_id, review_id, type } = req.body;
    if (!user_id || !review_id || !type) {
      return res
        .status(400)
        .json({ message: "Please fill out the information completely." });
    }

    const checkUserID = await db.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [user_id]
    );
    if (checkUserID.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const checkReview = await db.query(
      "SELECT review FROM review WHERE review_id = $1",
      [review_id]
    );
    if (checkReview.rows.length === 0) {
      return res.status(400).json({ message: "Review not found" });
    }

    const checkReviewUser = await db.query(
      "SELECT * FROM review_reaction WHERE user_id = $1 AND review_id = $2",
      [user_id, review_id]
    );

    if (checkReviewUser.rows.length > 0) {
      const existingReaction = checkReviewUser.rows[0];

      if (existingReaction.reaction_type === type) {
        await db.query(
          "DELETE FROM review_reaction WHERE user_id = $1 AND review_id = $2",
          [user_id, review_id]
        );

        return res.status(200).json({
          message: "Reaction removed successfully",
        });
      } else {
        const currentTime = new Date();
        const updateResult = await db.query(
          "UPDATE review_reaction SET reaction_type = $1, updated_at = $2 WHERE user_id = $3 AND review_id = $4 RETURNING *",
          [type, currentTime, user_id, review_id]
        );

        return res.status(200).json({
          message: "Reaction updated successfully",
          updatedReaction: updateResult.rows[0],
        });
      }
    }

    const insertReaction = await db.query(
      "INSERT INTO review_reaction (review_id, user_id, reaction_type) VALUES ($1, $2, $3) RETURNING *",
      [review_id, user_id, type]
    );
    res.status(201).json({
      message: `Review ${type} successfully`,
      review: insertReaction.rows[0],
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: `An error occurred while processing your request: ${error.message}`,
    });
  }
};

exports.getReaction = async (req, res) => {
  try {
    const { review_id } = req.params;
    if (!review_id) {
      console.log("Error: review_id is required.");
      return res.status(400).json({ message: "review_id is required." });
    }

    const result = await db.query(
      `SELECT 
          t1.review_id,
          COUNT(CASE WHEN t2.reaction_type = 'like' THEN 1 END) AS like_count,
          COUNT(CASE WHEN t2.reaction_type = 'dislike' THEN 1 END) AS dislike_count
      FROM 
          review t1
      LEFT JOIN 
          review_reaction t2 ON t1.review_id = t2.review_id
      where t1.review_id = $1
      GROUP BY 
          t1.review_id;`,
      [review_id]
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No data found." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "An error occurred while retrieving review ",
      error: error.message,
    });
  }
};

// exports.postPDF = async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "ไม่พบไฟล์ที่อัพโหลด" });
//   }

//   if (req.file.mimetype !== "application/pdf") {
//     fs.unlinkSync(req.file.path);
//     return res.status(400).json({ message: "อนุญาตให้ใช้ไฟล์ PDF เท่านั้น" });
//   }

//   if (req.file.size > 5 * 1024 * 1024) {
//     fs.unlinkSync(req.file.path);
//     return res.status(400).json({ message: "ขนาดไฟล์ต้องไม่เกิน 5MB" });
//   }

//   try {
//     const name = req.body.name || "";
//     const surname = req.body.surname || "";

//     // ใช้ชื่อและนามสกุลเพื่อสร้างชื่อไฟล์ใหม่
//     const fileName =
//       `${name}_${surname}.pdf` || path.basename(req.file.originalname);

//     const newFilePath = path.join(path.dirname(req.file.path), fileName);

//     fs.renameSync(req.file.path, newFilePath);

//     const result = await cloudinary.uploader.upload(newFilePath, {
//       folder: "SummaryFile",
//       upload_preset: "SummaryFile",
//       // public_id: fileName.replace(/\s+/g, "_"),
//     });

//     fs.unlinkSync(newFilePath);

//     return res.status(200).json({
//       message: "ไฟล์อัพโหลดสำเร็จ",
//       url: result.secure_url,
//     });
//   } catch (error) {
//     fs.unlinkSync(req.file.path);
//     return res.status(500).json({
//       message: "เกิดข้อผิดพลาดในการอัพโหลดไฟล์",
//       error: error.message,
//     });
//   }
// };

exports.getReviewByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      console.log("Error: subject_id is required.");
      return res.status(400).json({ message: "user_id is required." });
    }
    const checkUserID = await db.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [user_id]
    );
    if (checkUserID.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }
    const result = await db.query(
      `SELECT review_id, reaction_type FROM review_reaction WHERE user_id = $1`,
      [user_id]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "No data found." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "An error occurred while retrieving review ",
      error: error.message,
    });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const { review_id } = req.params;
    if (!review_id) {
      console.log("Error: review_id is required.");
      return res.status(400).json({ message: "review_id is required." });
    }

    let query = `
      select * from review where review_id = $1
    `;

    const queryParams = [review_id];

    const result = await db.query(query, queryParams);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "Data not found." });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      message: "An error occurred while retrieving reviews.",
      error: error.message,
    });
  }
};

exports.reportReview = async (req, res) => {
  try {
    const { user_id, report_desc } = req.body;
    const { review_id } = req.params;

    if (!user_id || !report_desc || !review_id) {
      return res
        .status(400)
        .json({ message: "Please fill out all the required fields." });
    }

    const checkUserID = await db.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [user_id]
    );
    if (checkUserID.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const checkReview = await db.query(
      "SELECT review_id FROM review WHERE review_id = $1",
      [review_id]
    );
    if (checkReview.rows.length === 0) {
      return res.status(400).json({ message: "Review not found" });
    }

    const Report = await db.query(
      `INSERT INTO report_review (user_id,review_id, report_desc) VALUES($1, $2,$3) RETURNING *`,
      [user_id, review_id, report_desc]
    );

    res.status(200).json({
      message: `Report review successfully`,
      post: Report.rows[0],
    });
  } catch (error) {
    console.error("Error in Report:", error);
    res.status(500).json({
      message: "An error occurred while submitting the post",
      error: error.message,
    });
  }
};