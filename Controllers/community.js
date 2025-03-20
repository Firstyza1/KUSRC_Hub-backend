const db = require("../db");

exports.createPost = async (req, res) => {
    try {
      const { user_id, post_desc, post_id } = req.body;
  
      if (!user_id || !post_desc) {
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
      let postQuery;
      let postValues;
  
      if (post_id) {
        const checkPost = await db.query(
          "SELECT post_id FROM post WHERE post_id = $1",
          [post_id]
        );
        if (checkPost.rows.length === 0) {
          return res.status(404).json({ message: "Post not found." });
        }
        postQuery = `
          UPDATE post
          SET post_desc = $1, 
              updated_at = $2
          WHERE post_id = $3 RETURNING *`;
        postValues = [post_desc, currentTime, post_id];
      } else {
        postQuery = `INSERT INTO post (user_id, post_desc,created_at) VALUES($1, $2,$3) RETURNING *`;
        postValues = [user_id, post_desc, currentTime];
      }
  
      const post = await db.query(postQuery, postValues);
      const statusCode = post_id ? 200 : 201;
      const action = post_id ? "updated" : "inserted";
      res.status(statusCode).json({
        message: `Post ${action} successfully`,
        post: post.rows[0],
      });
    } catch (error) {
      console.error("Error in post:", error);
      res.status(500).json({
        message: "An error occurred while submitting the post",
        error: error.message,
      });
    }
  };

exports.deletePost = async (req, res) => {
    const { post_id } = req.params;
    // const { user_id } = req.body;

    // ✅ แปลงเป็นตัวเลขก่อนตรวจสอบ
    const parsedPostId = parseInt(post_id, 10);
    // const parsedUserId = parseInt(user_id, 10);

    if (isNaN(parsedPostId)) {
        return res.status(400).json({ error: "post_id และ user_id ต้องเป็นตัวเลข" });
    }

    try {
        // ✅ ตรวจสอบว่าโพสต์มีอยู่จริง
        const checkQuery = "SELECT user_id FROM post WHERE post_id = $1;";
        const checkResult = await db.query(checkQuery, [parsedPostId]);

        if (checkResult.rowCount === 0) {
            return res.status(404).json({ error: "ไม่พบโพสต์ที่ต้องการลบ" });
        }

        // // ✅ เช็คว่า user เป็นเจ้าของโพสต์
        // const postOwnerId = checkResult.rows[0].user_id;
        // if (postOwnerId !== parsedUserId) {
        //     return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบโพสต์นี้" });
        // }

        // ✅ ลบโพสต์
        const deleteQuery = "DELETE FROM post WHERE post_id = $1 RETURNING *;";
        const result = await db.query(deleteQuery, [parsedPostId]);

        res.json({ message: "ลบโพสต์สำเร็จ", deletedPost: result.rows[0] });
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการลบโพสต์:", err);
        res.status(500).json({ error: "ไม่สามารถลบโพสต์ได้", details: err.message });
    }
};


exports.updatePost = async (req, res) => {
    const { post_id } = req.params; // รับ post_id จาก URL
    const { post_desc, user_id } = req.body; // รับค่าที่ต้องการอัปเดตจาก body

    // ตรวจสอบว่ามีข้อมูลที่ต้องการอัปเดตหรือไม่
    const parsedPostId = parseInt(post_id, 10);
    const parsedUserId = parseInt(user_id, 10);

    if (isNaN(parsedPostId) || isNaN(parsedUserId)) {
        return res.status(400).json({ error: "post_id และ user_id ต้องเป็นตัวเลข" });
    }
    if (!post_desc) {
        return res.status(400).json({ error: "กรุณาใส่ข้อความใหม่ของโพสต์ (post_desc)" });
    }

    try {
        // ✅ ตรวจสอบว่าโพสต์มีอยู่จริง และดึง user_id ของเจ้าของโพสต์
        const checkQuery = "SELECT user_id FROM post WHERE post_id  = $1;";
        const checkResult = await db.query(checkQuery, [parsedPostId]);

        if (checkResult.rowCount === 0) {
            return res.status(404).json({ error: "ไม่พบโพสต์ที่ต้องการแก้ไข" });
        }

        // ✅ เช็คว่า user เป็นเจ้าของโพสต์หรือไม่
        const postOwnerId = checkResult.rows[0].user_id;
        if (postOwnerId !== parsedUserId) {
            return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขโพสต์นี้" });
        }

        // ✅ อัปเดตโพสต์
        const updateQuery = `
            UPDATE post 
            SET post_desc = $1, updated_at = NOW() 
            WHERE post_id = $2 
            RETURNING *;
        `;
        const result = await db.query(updateQuery, [post_desc, parsedPostId]);

        res.json({ message: "แก้ไขโพสต์สำเร็จ", updatedPost: result.rows[0] });
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการแก้ไขโพสต์:", err);
        res.status(500).json({ error: "ไม่สามารถแก้ไขโพสต์ได้", details: err.message });
    }
};

exports.getPost = async (req, res) => {
    try {
        // ✅ ดึงข้อมูลโพสต์ทั้งหมด พร้อมข้อมูลผู้ใช้ที่โพสต์
        const query = `
             SELECT p.post_id, p.post_desc, p.created_at, p.updated_at,
                   u.user_id, u.username, u.user_profile,
                   COALESCE(COUNT(c.comment_id), 0) AS comment_count
            FROM post p
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN comment c ON p.post_id = c.post_id
            GROUP BY p.post_id, u.user_id
            ORDER BY p.created_at DESC;
        `;
        const result = await db.query(query);

        // ✅ ส่งข้อมูลกลับในรูปแบบ JSON
        res.status(200).json({ posts: result.rows });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงโพสต์:", error);
        res.status(500).json({ error: "ไม่สามารถดึงโพสต์ได้", details: error.message });
    }
};

// exports.getPostById = async (req, res) => {
//     const { post_id } = req.params; // รับ post_id จาก URL

//     // ✅ ตรวจสอบว่า post_id เป็นตัวเลขที่ถูกต้อง 100% (ไม่มีตัวอักษรปน)
//     if (!/^\d+$/.test(post_id)) {
//         return res.status(400).json({ error: "post_id ต้องเป็นตัวเลขเท่านั้น" });
//     }

//     const parsedPostId = parseInt(post_id, 10); // แปลงเป็น integer

//     try {
//         // ✅ ดึงข้อมูลโพสต์ตาม `post_id`
//         const query = `
//             SELECT p.post_id, p.post_desc, p.created_at, p.updated_at,
//                    u.user_id, u.username, u.user_profile 
//             FROM post p
//             JOIN users u ON p.user_id = u.user_id
//             WHERE p.post_id = $1;
//         `;
//         const result = await db.query(query, [parsedPostId]);

//         // ✅ ตรวจสอบว่ามีโพสต์นี้อยู่หรือไม่
//         if (result.rowCount === 0) {
//             return res.status(404).json({ error: "ไม่พบโพสต์นี้" });
//         }

//         // ✅ ส่งข้อมูลกลับในรูปแบบ JSON
//         res.status(200).json({ post: result.rows[0] });
//     } catch (error) {
//         console.error("เกิดข้อผิดพลาดในการดึงโพสต์:", error);
//         res.status(500).json({ error: "ไม่สามารถดึงโพสต์ได้", details: error.message });
//     }
// };
exports.reportPost = async (req, res) => {
    try {
      const { user_id, report_desc } = req.body;
      const { post_id } = req.params;
  
      if (!user_id || !report_desc || !post_id) {
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
  
      const checkPost = await db.query(
        "SELECT post_id FROM post WHERE post_id = $1",
        [post_id]
      );
      if (checkPost.rows.length === 0) {
        return res.status(400).json({ message: "Post not found" });
      }
  
      const Post = await db.query(
        `INSERT INTO report_post (user_id,post_id, report_desc) VALUES($1, $2,$3) RETURNING *`,
        [user_id, post_id, report_desc]
      );
  
      res.status(200).json({
        message: `Report Post successfully`,
        post: Post.rows[0],
      });
    } catch (error) {
      console.error("Error in Post:", error);
      res.status(500).json({
        message: "An error occurred while submitting the post",
        error: error.message,
      });
    }
  };

exports.getPostByPostId = async (req, res) => {
    const { post_id } = req.params;
    const { user_id = null } = req.query;
  
    if (!post_id || isNaN(post_id)) {
      console.log("Error: Invalid or missing post_id.");
      return res.status(400).json({ message: "Invalid or missing post_id." });
    }
  
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
              t1.updated_at,
              MAX(CASE WHEN t5.user_id = $2 AND t5.reaction_type = 'like' THEN 1 ELSE 0 END) AS user_has_liked,
              MAX(CASE WHEN t5.user_id = $2 AND t5.reaction_type = 'dislike' THEN 1 ELSE 0 END) AS user_has_disliked
          FROM post t1
          INNER JOIN users t2 ON t1.user_id = t2.user_id
          LEFT JOIN post_reaction t3 ON t1.post_id = t3.post_id
          LEFT JOIN comment t4 ON t1.post_id = t4.post_id
          LEFT JOIN post_reaction t5 ON t1.post_id = t5.post_id AND t5.user_id = $2
          WHERE t1.post_id = $1
          GROUP BY 
              t1.post_id, 
              t1.user_id, 
              t2.user_profile, 
              t2.username, 
              t1.post_desc, 
              t1.created_at, 
              t1.updated_at;
      `;
  
      const queryParams = [post_id, user_id];
      const result = await db.query(query, queryParams);
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
      } else {
        res.status(404).json({ message: "No data found." });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        error: "An error occurred while retrieving the post",
        message: error.message,
      });
    }
  };

exports.postReaction = async (req, res) => {
    try {
      const { user_id, post_id, type } = req.body;
      if (!user_id || !post_id || !type) {
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
  
      const checkPost = await db.query(
        "SELECT post_id FROM  post WHERE post_id = $1",
        [post_id]
      );
  
      if (checkPost.rows.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }
  
      const checkPostUser = await db.query(
        "SELECT * FROM post_reaction WHERE user_id = $1 AND post_id = $2",
        [user_id, post_id]
      );
  
      if (checkPostUser.rows.length > 0) {
        const existingReaction = checkPostUser.rows[0];
  
        if (existingReaction.reaction_type === type) {
          await db.query(
            "DELETE FROM post_reaction WHERE user_id = $1 AND post_id = $2",
            [user_id, post_id]
          );
  
          return res.status(200).json({
            message: "Reaction removed successfully",
          });
        } else {
          const currentTime = new Date();
          const updateResult = await db.query(
            "UPDATE post_reaction SET reaction_type = $1, updated_at = $2 WHERE user_id = $3 AND post_id = $4 RETURNING *",
            [type, currentTime, user_id, post_id]
          );
  
          return res.status(200).json({
            message: "Reaction updated successfully",
            updatedReaction: updateResult.rows[0],
          });
        }
      }
  
      const insertReaction = await db.query(
        "INSERT INTO post_reaction (post_id, user_id, reaction_type) VALUES ($1, $2, $3) RETURNING *",
        [post_id, user_id, type]
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

exports.createComment = async (req, res) => {
    try {
      const { user_id, post_id, comment_desc, comment_id } = req.body;
  
      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸—à¸µà¹ˆà¸ˆà¸³à¹€à¸›à¹‡à¸™
      if (!user_id || !post_id || !comment_desc) {
        return res
          .status(400)
          .json({ message: "Please fill out all the required fields." });
      }
  
      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰
      const checkUserID = await db.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [user_id]
      );
      if (checkUserID.rows.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }
  
      // à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¹‚à¸žà¸ªà¸•à¹Œ
      const checkPost = await db.query(
        "SELECT post_id FROM post WHERE post_id = $1",
        [post_id]
      );
      if (checkPost.rows.length === 0) {
        return res.status(400).json({ message: "Post not found" });
      }
  
      const currentTime = new Date();
      let commentQuery;
      let commentValues;
  
      if (comment_id) {
        // à¸à¸£à¸“à¸µà¸­à¸±à¸›à¹€à¸”à¸•à¸„à¸§à¸²à¸¡à¸„à¸´à¸”à¹€à¸«à¹‡à¸™
        const checkComment = await db.query(
          "SELECT comment_id FROM comment WHERE comment_id = $1",
          [comment_id]
        );
        if (checkComment.rows.length === 0) {
          return res.status(404).json({ message: "Comment not found." });
        }
        commentQuery = `
          UPDATE comment
          SET comment_desc = $1, 
              updated_at = $2
          WHERE comment_id = $3 RETURNING *`;
        commentValues = [comment_desc, currentTime, comment_id];
      } else {
        // à¸à¸£à¸“à¸µà¸ªà¸£à¹‰à¸²à¸‡à¸„à¸§à¸²à¸¡à¸„à¸´à¸”à¹€à¸«à¹‡à¸™à¹ƒà¸«à¸¡à¹ˆ
        commentQuery = `
          INSERT INTO comment (user_id, post_id, comment_desc, created_at) 
          VALUES($1, $2, $3, $4) RETURNING *`;
        commentValues = [user_id, post_id, comment_desc, currentTime];
      }
  
      // à¸”à¸³à¹€à¸™à¸´à¸™à¸à¸²à¸£à¸à¸±à¸šà¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥
      const comment = await db.query(commentQuery, commentValues);
  
      // à¸ªà¹ˆà¸‡à¸œà¸¥à¸¥à¸±à¸žà¸˜à¹Œà¸à¸¥à¸±à¸šà¹„à¸›
      const statusCode = comment_id ? 200 : 201;
      const action = comment_id ? "updated" : "inserted";
      res.status(statusCode).json({
        message: `Comment ${action} successfully`,
        comment: comment.rows[0],
      });
    } catch (error) {
      console.error("Error in comment:", error);
      res.status(500).json({
        message: "An error occurred while submitting the comment",
        error: error.message,
      });
    }
  };

exports.getCommentByPost = async (req, res) => {
    const { page = 1, limit = 10, user_id = null } = req.query;
    const offset = (page - 1) * limit;
    const { post_id } = req.params;
  
    try {
      let query = `
        SELECT
            t1.comment_id,           
            t1.user_id, 
            t2.user_profile,  
            t2.username,
            t1.comment_desc,
            t1.post_id,
            COUNT(DISTINCT CASE WHEN t3.reaction_type = 'like' THEN t3.reaction_id END) AS like_count,
            COUNT(DISTINCT CASE WHEN t3.reaction_type = 'dislike' THEN t3.reaction_id END) AS dislike_count,
            MAX(CASE WHEN t3.user_id = $1 AND t3.reaction_type = 'like' THEN 1 ELSE 0 END) AS user_has_liked,
            MAX(CASE WHEN t3.user_id = $1 AND t3.reaction_type = 'dislike' THEN 1 ELSE 0 END) AS user_has_disliked,
            t1.created_at,
            t1.updated_at
        FROM comment t1
        JOIN users t2 ON t2.user_id = t1.user_id 
        LEFT JOIN comment_reaction t3 ON t1.comment_id = t3.comment_id
        WHERE t1.post_id = $2
        GROUP BY 
            t1.comment_id, 
            t1.user_id, 
            t2.user_profile,  
            t2.username,
            t1.comment_desc,
            t1.post_id,
            t1.created_at, 
            t1.updated_at
        ORDER BY t1.created_at DESC
        LIMIT $3 OFFSET $4;
      `;
  
      const queryParams = [user_id, post_id, limit, offset];
  
      const result = await db.query(query, queryParams);
  
      if (result.rows.length > 0) {
        res.status(200).json(result.rows);
      } else {
        res.status(200).json([]);
        // res.status(404).json({ message: "No data found." });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        error: "An error occurred while retrieving post",
        message: error.message,
      });
    }
  };

exports.commentReaction = async (req, res) => {
    try {
      const { user_id, comment_id, type } = req.body;
      if (!user_id || !comment_id || !type) {
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
  
      const checkComment = await db.query(
        "SELECT comment FROM comment WHERE comment_id = $1",
        [comment_id]
      );
      if (checkComment.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }
  
      const checkCommentUser = await db.query(
        "SELECT * FROM comment_reaction WHERE user_id = $1 AND comment_id = $2",
        [user_id, comment_id]
      );
  
      if (checkCommentUser.rows.length > 0) {
        const existingReaction = checkCommentUser.rows[0];
  
        if (existingReaction.reaction_type === type) {
          await db.query(
            "DELETE FROM comment_reaction WHERE user_id = $1 AND comment_id = $2",
            [user_id, comment_id]
          );
  
          return res.status(200).json({
            message: "Reaction removed successfully",
          });
        } else {
          const currentTime = new Date();
          const updateResult = await db.query(
            "UPDATE comment_reaction SET reaction_type = $1, updated_at = $2 WHERE user_id = $3 AND comment_id = $4 RETURNING *",
            [type, currentTime, user_id, comment_id]
          );
  
          return res.status(200).json({
            message: "Reaction updated successfully",
            updatedReaction: updateResult.rows[0],
          });
        }
      }
  
      const insertReaction = await db.query(
        "INSERT INTO comment_reaction (comment_id, user_id, reaction_type) VALUES ($1, $2, $3) RETURNING *",
        [comment_id, user_id, type]
      );
      res.status(201).json({
        message: `Comment ${type} successfully`,
        comment: insertReaction.rows[0],
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        error: `An error occurred while processing your request: ${error.message}`,
      });
    }
  };

exports.reportComment = async (req, res) => {
    try {
      const { user_id, report_desc } = req.body;
      const { comment_id } = req.params;
  
      if (!user_id || !report_desc || !comment_id) {
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
  
      const checkComment = await db.query(
        "SELECT comment_id FROM comment WHERE comment_id = $1",
        [comment_id]
      );
      if (checkComment.rows.length === 0) {
        return res.status(404).json({ message: "Comment not found" });
      }
  
      const comment = await db.query(
        `INSERT INTO report_comment (user_id,comment_id, report_desc) VALUES($1, $2,$3) RETURNING *`,
        [user_id, comment_id, report_desc]
      );
  
      res.status(200).json({
        message: `Report Comment successfully`,
        comment: comment.rows[0],
      });
    } catch (error) {
      console.error("Error in Comment :", error);
      res.status(500).json({
        message: "An error occurred while submitting the comment",
        error: error.message,
      });
    }
  };

exports.deleteComment = async (req, res) => {
    try {
      const { comment_id } = req.params;
      // const { user_id } = req.query;
  
      // if (!user_id) {
      //   return res.status(400).json({ message: "user_id is required" });
      // }
  
      const comment = await db.query(
        "SELECT * FROM comment WHERE comment_id = $1",
        [comment_id]
      );
      if (comment.rowCount === 0) {
        return res.status(404).json({ message: "Comment Not Found." });
      }
  
      const result = await db.query(
        "DELETE FROM comment WHERE comment_id = $1 RETURNING*",
        [comment_id]
      );
  
      res.json({
        message: "Comment Deleted Successfully,",
        comment: result.rows[0],
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        error: `An error occurred while retrieving post `,
        error: error.message,
      });
    }
  };