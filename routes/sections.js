import express from 'express';
import PG from 'pg';
const router = express.Router();

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});

db.connect();

router.get('/order', async (req, res) => {
	try {
		const order = req.query.order.split(',');
		for (let i = 0; i < order.length; i++) {
			await db.query('UPDATE sections SET order_num = $1 WHERE id = $2', [i, order[i]]);
		}
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/delete', async (req, res) => {
	try {
		await db.query('DELETE FROM todos WHERE section_id = $1', [req.query.id]);
		await db.query('DELETE FROM sections WHERE id = $1', [req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/new', async (req, res) => {
	try {
		const result = await db.query(
			'INSERT INTO sections (color, selected, order_num, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
			[req.query.color, false, 0, req.user.id],
		);
		res.json({ id: result.rows[0].id });
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/update-title', async (req, res) => {
	try {
		await db.query('UPDATE sections SET title = $1 WHERE id = $2', [
			req.query.title,
			req.query.id,
		]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/update-theme', async (req, res) => {
	try {
		await db.query('UPDATE sections SET color = $1 WHERE id = $2', [
			req.query.color,
			req.query.id,
		]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

export default router;
