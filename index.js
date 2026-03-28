import express from 'express';
import PG from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;
const app = express();

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});
// const db = new PG.Client({
// 	host: 'localhost',
// 	port: 5432,
// 	database: 'to_do_list_debug',
// 	user: 'postgres',
// 	password: '1035pg$T8',
// });

db.connect();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));

app.get('/', async (req, res) => {
	try {
		const sections = await db.query('SELECT * FROM sections ORDER BY order_num ASC, id DESC');
		for (let i = 0; i < sections.rows.length; i++) {
			const todos = await db.query(
				'SELECT * FROM todos WHERE section_id = $1 ORDER BY order_num ASC, id DESC',
				[sections.rows[i].id],
			);
			sections.rows[i].toDos = todos.rows;
		}
		res.render('index.ejs', { sections: sections.rows });
		// console.log(process.env.CONNECTION_STRING);
		// res.render('index.ejs', { sections: [] });
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
	// console.log('Hello World');
	// res.send('Hello World');
});

app.get('/order-sections', async (req, res) => {
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

app.get('/order-todos', async (req, res) => {
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

app.get('/new-to-do', async (req, res) => {
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

app.get('/update-to-do-text', async (req, res) => {
	try {
		await db.query('UPDATE todos SET title = $1 WHERE id = $2', [req.query.text, req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

app.get('/delete-to-do', async (req, res) => {
	try {
		await db.query('DELETE FROM todos WHERE id = $1', [req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

app.get('/set-to-do-complete', async (req, res) => {
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

app.get('/delete-section', async (req, res) => {
	try {
		await db.query('DELETE FROM todos WHERE section_id = $1', [req.query.id]);
		await db.query('DELETE FROM sections WHERE id = $1', [req.query.id]);
		res.sendStatus(200);
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

app.get('/new-section', async (req, res) => {
	try {
		const result = await db.query(
			'INSERT INTO sections (color, selected, order_num) VALUES ($1, $2, $3) RETURNING id',
			[req.query.color, false, 0],
		);
		res.json({ id: result.rows[0].id });
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

app.get('/update-section-title', async (req, res) => {
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

app.get('/update-section-theme', async (req, res) => {
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

// app.listen(PORT, () => {
// 	console.log(`App running at localhost:${PORT}`);
// });

export default app;
