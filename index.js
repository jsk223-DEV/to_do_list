import express from 'express';
import PG from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();

const db = new PG.Client({
	connectionString: process.env.DATABASE_URL,
	host: process.env.HOSTNAME,
	port: process.env.PORT,
	database: process.env.DATABASE,
	user: process.env.USERNAME,
	password: process.env.PASSWORD,
});

db.connect();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const exampleData = [
	{
		id: 0,
		title: '1st Title',
		color: [16, 0, 163],
		toDos: [
			{ id: 0, title: '1st To Do' },
			{ id: 1, title: '2nd To Do' },
			{ id: 2, title: '3rd To Do' },
			{ id: 3, title: '4th To Do' },
		],
	},
	{
		id: 1,
		title: '2nd Title',
		color: [163, 0, 16],
		toDos: [
			{ id: 0, title: '1st To Do' },
			{ id: 1, title: '2nd To Do' },
			{ id: 2, title: '3rd To Do' },
			{ id: 3, title: '4th To Do' },
		],
	},
	{
		id: 2,
		title: '3rd Title',
		color: [0, 163, 16],
		toDos: [
			{ id: 0, title: '1st To Do' },
			{ id: 1, title: '2nd To Do' },
			{ id: 2, title: '3rd To Do' },
			{ id: 3, title: '4th To Do' },
			{ id: 4, title: '5th To Do' },
			{ id: 5, title: '6th To Do' },
			{ id: 6, title: '7th To Do' },
			{ id: 7, title: '8th To Do' },
			{ id: 8, title: '9th To Do' },
			{ id: 9, title: '10th To Do' },
			{ id: 10, title: '11th To Do' },
			{ id: 11, title: '12th To Do' },
			{ id: 12, title: '13th To Do' },
			{ id: 13, title: '14th To Do' },
		],
	},
	{
		id: 3,
		title: '4th Title',
		color: [163, 163, 0],
		toDos: [
			{ id: 0, title: '1st To Do' },
			{ id: 1, title: '2nd To Do' },
			{ id: 2, title: '3rd To Do' },
		],
	},
	{
		id: 4,
		title: '5th Title',
		color: [0, 163, 163],
		toDos: [
			{ id: 0, title: '1st To Do' },
			{ id: 1, title: '2st To Do' },
		],
	},
];

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
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
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
			['163,0,16', false, 0],
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

app.listen(PORT, () => {
	console.log(`App running at localhost:${PORT}`);
});
