const db = require("../db");

exports.createPost = async (req, res) => {
    const { user_id } = req.params; // รับ user_id จากพารามิเตอร์ URL
    const { post_desc } = req.body; // รับ post_desc จาก body request

    // ตรวจสอบว่ามีค่าที่จำเป็นหรือไม่
    if (!post_desc) {
        return res.status(400).json({ error: "กรุณาใส่รายละเอียดโพสต์" });
    }

    if (!user_id) {
        return res.status(400).json({ error: "กรุณาใส่ user_id" });
    }

     const queryUser = `
          SELECT user_id, email, username, user_profile, created_at, updated_at 
          FROM users 
          WHERE user_id = $1
        `;
        const result = await db.query(queryUser, [user_id]);
    
        // ตรวจสอบว่าพบข้อมูลหรือไม่
        if (result.rows.length === 0) {
          return res.status(404).json({ message: "ไม่พบ user_id" });
        }

    // คำสั่ง SQL สำหรับเพิ่มข้อมูลลงในตาราง post
    const query = `
        INSERT INTO post (user_id, post_desc, created_at, updated_at) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    const currentTime = new Date();
    try {
        // ใช้ db.query() ในการ execute SQL
        const result = await db.query(query, [user_id, post_desc,currentTime,currentTime]);

        // ส่งข้อมูลโพสต์ที่เพิ่มกลับไปให้ client
        res.status(201).json({
            message: "สร้างโพสต์สำเร็จ",
            post: result.rows[0],
        });
    } catch (err) {
        console.error("เกิดข้อผิดพลาดในการเพิ่มโพสต์:", err);
        res.status(500).json({ error: "ไม่สามารถเพิ่มโพสต์ได้" });
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

exports.getPostById = async (req, res) => {
    const { post_id } = req.params; // รับ post_id จาก URL

    // ✅ ตรวจสอบว่า post_id เป็นตัวเลขที่ถูกต้อง 100% (ไม่มีตัวอักษรปน)
    if (!/^\d+$/.test(post_id)) {
        return res.status(400).json({ error: "post_id ต้องเป็นตัวเลขเท่านั้น" });
    }

    const parsedPostId = parseInt(post_id, 10); // แปลงเป็น integer

    try {
        // ✅ ดึงข้อมูลโพสต์ตาม `post_id`
        const query = `
            SELECT p.post_id, p.post_desc, p.created_at, p.updated_at,
                   u.user_id, u.username, u.user_profile 
            FROM post p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.post_id = $1;
        `;
        const result = await db.query(query, [parsedPostId]);

        // ✅ ตรวจสอบว่ามีโพสต์นี้อยู่หรือไม่
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "ไม่พบโพสต์นี้" });
        }

        // ✅ ส่งข้อมูลกลับในรูปแบบ JSON
        res.status(200).json({ post: result.rows[0] });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงโพสต์:", error);
        res.status(500).json({ error: "ไม่สามารถดึงโพสต์ได้", details: error.message });
    }
};
