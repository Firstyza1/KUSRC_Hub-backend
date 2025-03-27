const db = require("../db");
exports.getAllReviews = async (req, res) => {
  try {
    // คิวรีดึงข้อมูลรีวิวทั้งหมด
    const query = `
        SELECT r.review_id, r.user_id,u.username, r.subject_id,s.subject_thai ,s.subject_eng , r.review_desc, r.pdf_path, r.created_at, r.updated_at 
FROM review r
join users u on u.user_id =  r.user_id
join subject s on s.subject_id =  r.subject_id
      `;
    const result = await db.query(query);

    // // ตรวจสอบว่ามีข้อมูลหรือไม่
    // if (result.rows.length === 0) {
    //   return res.status(404).json({ message: "No reviews found" });
    // }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      reviews: result.rows, // คืนค่าข้อมูลรีวิวทั้งหมด
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลรีวิวทั้งหมด:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะดึงข้อมูลรีวิว",
      error: error.message,
    });
  }
};

exports.getAllReportedReview = async (req, res) => {
  try {
    // คิวรีดึงข้อมูลการรีพอร์ตรีวิวทั้งหมดจากตาราง report_review
    const query = `
        SELECT re.report_id, re.user_id,u.username, re.review_id,r.review_desc ,re.report_desc, re.created_at, re.updated_at 
        FROM report_review re
        join users u on u.user_id =  re.user_id
        join review r on r.review_id =  re.review_id

      `;
    const result = await db.query(query);

    // // ตรวจสอบว่ามีข้อมูลหรือไม่
    // if (result.rows.length === 0) {
    //   return res.status(404).json({ message: "No reported reviews found" });
    // }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      reported_review: result.rows, // คืนค่าข้อมูลการรีพอร์ตรีวิวทั้งหมด
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการรีพอร์ตรีวิว:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะดึงข้อมูลการรีพอร์ตรีวิว",
      error: error.message,
    });
  }
};

exports.deleteReportedReview = async (req, res) => {
  try {
    const { report_id } = req.params; // รับ report_id จาก URL parameter

    // ตรวจสอบว่ามี report_id ที่ส่งมาหรือไม่
    if (!report_id) {
      return res.status(400).json({ message: "ต้องระบุ report_id" });
    }

    // คิวรีตรวจสอบว่า report มีอยู่หรือไม่ก่อนลบ
    const checkQuery = `SELECT * FROM report_review WHERE report_id = $1`;
    const checkResult = await db.query(checkQuery, [report_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    // คิวรีลบข้อมูลการรีพอร์ตรีวิว
    const deleteQuery = `DELETE FROM report_review WHERE report_id = $1`;
    await db.query(deleteQuery, [report_id]);

    // ตอบกลับเมื่อทำการลบสำเร็จ
    res.status(200).json({ message: "ลบการรีพอร์ตรีวิวสำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบการรีพอร์ตรีวิว:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะลบการรีพอร์ตรีวิว",
      error: error.message,
    });
  }
};

exports.getAllReportedPost = async (req, res) => {
  try {
    // คิวรีดึงข้อมูลการรีพอร์ตรีวิวทั้งหมดจากตาราง report_review
    const query = `
        SELECT re.report_id, re.user_id,u.username, re.post_id,p.post_desc ,re.report_desc, re.created_at
        FROM report_post re
        join users u on u.user_id =  re.user_id
        join post p on p.post_id =  re.post_id

      `;
    const result = await db.query(query);

    // // ตรวจสอบว่ามีข้อมูลหรือไม่
    // if (result.rows.length === 0) {
    //   return res.status(404).json({ message: "No reported reviews found" });
    // }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      reported_post: result.rows, // คืนค่าข้อมูลการรีพอร์ตรีวิวทั้งหมด
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการรีพอร์ตรีวิว:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะดึงข้อมูลการรีพอร์ตรีวิว",
      error: error.message,
    });
  }
};

exports.deleteReportedPost = async (req, res) => {
  try {
    const { report_id } = req.params; // รับ report_id จาก URL parameter

    // ตรวจสอบว่ามี report_id ที่ส่งมาหรือไม่
    if (!report_id) {
      return res.status(400).json({ message: "ต้องระบุ report_id" });
    }

    // คิวรีตรวจสอบว่า report มีอยู่หรือไม่ก่อนลบ
    const checkQuery = `SELECT * FROM report_post WHERE report_id = $1`;
    const checkResult = await db.query(checkQuery, [report_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    // คิวรีลบข้อมูลการรีพอร์ตโพสต์
    const deleteQuery = `DELETE FROM report_post WHERE report_id = $1`;
    await db.query(deleteQuery, [report_id]);

    // ตอบกลับเมื่อทำการลบสำเร็จ
    res.status(200).json({ message: "ลบคำร้องโพสต์สำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบคำร้องโพสต์:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะลบคำร้องโพสต์",
      error: error.message,
    });
  }
};

exports.getAllReportedComment = async (req, res) => {
  try {
    // คิวรีดึงข้อมูลการรีพอร์ตรีวิวทั้งหมดจากตาราง report_review
    const query = `
        SELECT re.report_id, re.user_id,u.username, re.comment_id,c.comment_desc ,re.report_desc, re.created_at
        FROM report_comment re
        join users u on u.user_id =  re.user_id
        join comment c on c.comment_id =  re.comment_id

      `;
    const result = await db.query(query);

    // // ตรวจสอบว่ามีข้อมูลหรือไม่
    // if (result.rows.length === 0) {
    //   return res.status(404).json({ message: "No reported reviews found" });
    // }

    // ส่งข้อมูลกลับในรูปแบบ JSON
    res.status(200).json({
      reported_comment: result.rows, // คืนค่าข้อมูลการรีพอร์ตรีวิวทั้งหมด
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลการรีพอร์ตรีวิว:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะดึงข้อมูลการรีพอร์ตรีวิว",
      error: error.message,
    });
  }
};

exports.deleteReportedComment = async (req, res) => {
  try {
    const { report_id } = req.params; // รับ report_id จาก URL parameter

    // ตรวจสอบว่ามี report_id ที่ส่งมาหรือไม่
    if (!report_id) {
      return res.status(400).json({ message: "ต้องระบุ report_id" });
    }

    // คิวรีตรวจสอบว่ามีรายงานอยู่ในระบบหรือไม่
    const checkQuery = `SELECT * FROM report_comment WHERE report_id = $1`;
    const checkResult = await db.query(checkQuery, [report_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    // คิวรีลบข้อมูลการรีพอร์ตคอมเมนต์
    const deleteQuery = `DELETE FROM report_comment WHERE report_id = $1`;
    await db.query(deleteQuery, [report_id]);

    // ตอบกลับเมื่อทำการลบสำเร็จ
    res.status(200).json({ message: "ลบคำร้องคอมเมนต์สำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการลบคำร้องคอมเมนต์:", error);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดขณะลบคำร้องคอมเมนต์",
      error: error.message,
    });
  }
};



exports.getAllStats = async (req, res) => {
  try {
      // คิวรีนับจำนวนข้อมูลจากแต่ละตาราง
      const query = `
          SELECT 
              (SELECT COUNT(user_id) FROM users) AS total_users,
              (SELECT COUNT(subject_id) FROM subject) AS total_subjects,
              (SELECT COUNT(review_id) FROM review) AS total_reviews,
              (SELECT COUNT(post_id) FROM post) AS total_posts,
              (SELECT COUNT(report_id) FROM report_review) AS total_reported_reviews,
              (SELECT COUNT(report_id) FROM report_post) AS total_reported_posts,
              (SELECT COUNT(report_id) FROM report_comment) AS total_reported_comments
      `;
      
      // คิวรีนับจำนวนข้อมูลที่เพิ่มขึ้นในเดือนปัจจุบันและเดือนที่แล้ว
      const growthQuery = `
          SELECT 'users' AS type, COUNT(user_id) AS current, 
              (SELECT COUNT(user_id) FROM users 
               WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE - INTERVAL '1 month')
               AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE - INTERVAL '1 month')) AS last 
          FROM users WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE) 
                AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE)
          UNION ALL
          SELECT 'subjects', COUNT(subject_id), 
              (SELECT COUNT(subject_id) FROM subject WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE - INTERVAL '1 month')
               AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE - INTERVAL '1 month')) 
          FROM subject WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE) 
                AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE)
          UNION ALL
          SELECT 'reviews', COUNT(review_id), 
              (SELECT COUNT(review_id) FROM review WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE - INTERVAL '1 month')
               AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE - INTERVAL '1 month')) 
          FROM review WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE) 
                AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE)
          UNION ALL
          SELECT 'posts', COUNT(post_id), 
              (SELECT COUNT(post_id) FROM post WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE - INTERVAL '1 month')
               AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE - INTERVAL '1 month')) 
          FROM post WHERE DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE) 
                AND DATE_PART('month', created_at) = DATE_PART('month', CURRENT_DATE);
      `;

      const statsResult = await db.query(query);
      const growthResult = await db.query(growthQuery);

      // จัดรูปแบบข้อมูลที่ส่งกลับ
      const growthData = {};
      growthResult.rows.forEach(row => {
          growthData[row.type] = {
              current_month: row.current || 0,
              last_month: row.last || 0
          };
      });

      res.status(200).json({
          stats: statsResult.rows[0],
          growth: growthData
      });
  } catch (error) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลจำนวน:", error);
      res.status(500).json({
          message: "เกิดข้อผิดพลาดขณะดึงข้อมูลจำนวน",
          error: error.message,
      });
  }
};

exports.getAllPost = async (req, res) => {
  try {
    let query = `
      SELECT 
        t1.post_id, 
        t1.user_id, 
        t2.user_profile, 
        t2.username, 
        t1.post_desc, 
        COUNT(DISTINCT CASE WHEN t3.reaction_type = 'like' THEN t3.reaction_id END) AS like_count,
        COUNT(DISTINCT CASE WHEN t3.reaction_type = 'dislike' THEN t3.reaction_id END) AS dislike_count,
        COUNT(DISTINCT t4.comment_id) AS comment_count,
        t1.created_at,
        t1.updated_at
      FROM post t1
      INNER JOIN users t2 ON t1.user_id = t2.user_id
      LEFT JOIN post_reaction t3 ON t1.post_id = t3.post_id
      LEFT JOIN comment t4 ON t1.post_id = t4.post_id
      GROUP BY 
        t1.post_id, 
        t1.user_id, 
        t2.user_profile, 
        t2.username, 
        t1.post_desc, 
        t1.created_at, 
        t1.updated_at;
    `;

    const result = await db.query(query);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      error: "An error occurred while retrieving post",
      message: error.message,
    });
  }
};