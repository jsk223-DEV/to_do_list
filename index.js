import express from 'express';
import PG from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import cookieSession from 'cookie-session';

import toDosRouter from './routes/todos.js';
import sectionsRouter from './routes/sections.js';
import usersRouter from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;
const app = express();

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});

db.connect();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(
	cookieSession({
		name: 'session',
		keys: ['TopSecret'],
		httpOnly: true,
		maxAge: 1000 * 60 * 60 * 24 * 100,
	}),
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/todos', toDosRouter);
app.use('/sections', sectionsRouter);
app.use('/users', usersRouter);

app.get('/', async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			res.redirect('/home');
		} else {
			if (req.session.messages) {
				res.render('login.ejs', {
					error: { message: req.session.messages[req.session.messages.length - 1] },
				});
			} else {
				res.render('login.ejs');
			}
		}
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

app.get('/home', async (req, res) => {
	try {
		if (!req.isAuthenticated()) {
			res.redirect('/');
			return;
		}
		const sections = await db.query(
			'SELECT * FROM sections WHERE user_id = $1 ORDER BY order_num ASC, id DESC',
			[req.user.id],
		);
		for (let i = 0; i < sections.rows.length; i++) {
			const todos = await db.query(
				'SELECT * FROM todos WHERE section_id = $1 ORDER BY order_num ASC, id DESC',
				[sections.rows[i].id],
			);
			sections.rows[i].toDos = todos.rows;
		}
		res.render('index.ejs', { sections: sections.rows, user: req.user.username });
	} catch (err) {
		console.error(err);
		res.sendStatus(404);
	}
});

//serializeUser stores the user in the store after succesfull authentication
passport.serializeUser((user, cb) => {
	cb(null, user.id);
});

//deserializeUser fetches the user from the store when needed
passport.deserializeUser(async (user, cb) => {
	const result = await db.query('SELECT * FROM users WHERE id = $1', [user]);
	cb(null, result.rows[0]);
});

// app.listen(PORT, () => {
// 	console.log(`App running at localhost:${PORT}`);
// });

export default app;

// {
// 	"src": "./public/*",

// 	"use": "@vercel/static"
// },
