const express = require('express');
const cors = require('cors'); // นำเข้า cors
const app = express();
const morgan = require('morgan')
const bodyParse = require('body-parser')
app.use(morgan('dev'))
app.use(cors()); // ตั้งค่า CORS ให้รองรับ request จากทุกโดเมน
app.use(express.json()); // ใช้ express.json() เพื่อรองรับข้อมูล JSON

const { readdirSync } = require('fs');

// อ่านไฟล์ทั้งหมดในโฟลเดอร์ Routes และใช้เส้นทาง
readdirSync('./Routes')
    .map((r) => app.use(require('./Routes/' + r))); // โหลดเส้นทางแต่ละไฟล์

app.listen(3000, () => console.log('Server is Running on port 3000'));
