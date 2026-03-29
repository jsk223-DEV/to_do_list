import express from 'express';
import PG from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from 'passport';
import { Strategy } from 'passport-local';
import bcrypt from 'bcrypt';
import cookieSession from 'cookie-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;
const app = express();
const saltRounds = 10;

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});

db.connect();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// app.use(
// 	cookieSession({
// 		name: 'session',
// 		keys: [process.env.SESSION_SECRET],
// 		maxAge: 1000 * 60 * 60 * 24 * 100,

// 	}),
// );
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 100,
		},
	}),
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', async (req, res) => {
	try {
		if (req.isAuthenticated()) {
			res.redirect('/sections');
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

app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/sections',
		failureRedirect: '/',
		failureMessage: true,
	}),
);

app.get('/logout', (req, res) => {
	req.logout((err) => {
		if (err) {
			res.send('Error logging out: ' + err);
		}
		res.redirect('/');
	});
});

app.post('/register', async (req, res) => {
	try {
		const checkResult = await db.query('SELECT * FROM users WHERE username = $1', [
			req.body.username,
		]);
		if (checkResult.rows.length > 0) {
			res.render('login.ejs', { error: { message: 'That username is already taken' } });
			return;
		} else {
			bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
				if (err) {
					res.send('Error hashing password: ' + err);
					return;
				}
				const result = await db.query(
					'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
					[req.body.username, hash],
				);
				req.login(result.rows[0], (err) => {
					if (err) {
						console.error(err);
					} else {
						res.redirect('/sections');
					}
				});
			});
		}
	} catch (err) {
		console.log(err);
		res.send('Error Registering: ' + err);
	}
});

app.get('/sections', async (req, res) => {
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
		// console.log(process.env.CONNECTION_STRING);
		// res.render('index.ejs', { sections: [] });
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
			'INSERT INTO sections (color, selected, order_num, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
			[req.query.color, false, 0, req.user.id],
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

passport.use(
	new Strategy(async function verify(username, password, cb) {
		try {
			const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
			if (result.rows.length > 0) {
				let user = result.rows[0];
				bcrypt.compare(password, user.password, (err, result) => {
					if (err) {
						return cb(err, false);
					}
					if (result) {
						return cb(null, user);
					} else {
						return cb(null, false, { message: 'Wrong password' });
					}
				});
			} else {
				cb(null, false, { message: 'Username not found' });
			}
		} catch (err) {
			return cb(err);
		}
	}),
);

//serializeUser stores the user in the store after succesfull authentication
passport.serializeUser((user, cb) => {
	cb(null, user);
});

//deserializeUser fetches the user from the store when needed
passport.deserializeUser((user, cb) => {
	cb(null, user);
});

// app.listen(PORT, () => {
// 	console.log(`App running at localhost:${PORT}`);
// });

export default app;
