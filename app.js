// app.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = 3000;

// 設定
app.set('view engine', 'ejs');
app.use(express.static('public')); // CSSや画像用
app.use(bodyParser.urlencoded({ extended: true }));

// 1. ダッシュボード（トップページ）: グラフと最新ログを表示
app.get('/', async (req, res) => {
    try {
        // 全科目と、最近の学習ログを取得
        const subjects = await prisma.subject.findMany();
        const logs = await prisma.log.findMany({
            include: { subject: true },
            orderBy: { createdAt: 'desc' },
            take: 10 // 最新10件のみ
        });

        // グラフ用の集計データを作成 (科目ごとの学習時間合計)
        const stats = await prisma.log.groupBy({
            by: ['subjectId'],
            _sum: { minutes: true },
        });

        res.render('index', { subjects, logs, stats });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// 2. 科目追加ページ
app.get('/subjects/new', (req, res) => {
    res.render('add_subject');
});

// 3. 科目登録処理
app.post('/subjects', async (req, res) => {
    const { name, color } = req.body;
    await prisma.subject.create({
        data: { name, color }
    });
    res.redirect('/');
});

// 4. 学習記録登録処理
app.post('/logs', async (req, res) => {
    const { subjectId, minutes, comment } = req.body;
    await prisma.log.create({
        data: {
            subjectId: parseInt(subjectId),
            minutes: parseInt(minutes),
            comment
        }
    });
    res.redirect('/');
});

// 5. 記録の削除（CRUDのDelete）
app.post('/logs/delete/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.log.delete({
        where: { id: parseInt(id) }
    });
    res.redirect('/');
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});