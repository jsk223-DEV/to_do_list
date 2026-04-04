import express from 'express';
import PG from 'pg';
const router = express.Router();

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});

db.connect();

router.get('/order', async (req, res) => {
	//const section = req.query.section;
	try {
		const order = req.query.order.split(',');
		for (let i = 0; i < order.length; i++) {
			await db.query('UPDATE todos SET order_num = $1 WHERE id = $2', [i, order[i]]);
		}
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/new', async (req, res) => {
	try {
		const result = await db.query(
			'INSERT INTO todos (section_id, order_num) VALUES ($1, $2) RETURNING id',
			[req.query.section, 0],
		);
		res.json({ id: result.rows[0].id });
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/update-text', async (req, res) => {
	try {
		await db.query('UPDATE todos SET title = $1 WHERE id = $2', [req.query.text, req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/delete', async (req, res) => {
	try {
		await db.query('DELETE FROM todos WHERE id = $1', [req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

router.get('/set-complete', async (req, res) => {
	try {
		const toDos = await db.query('SELECT * FROM todos');
		await db.query('UPDATE todos SET complete = $1 WHERE id = $2', [
			req.query.complete,
			req.query.id,
		]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

export default router;
