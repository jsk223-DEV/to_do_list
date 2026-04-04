import express from 'express';
import passport from 'passport';
import PG from 'pg';
import { Strategy } from 'passport-local';
import bcrypt from 'bcrypt';

const router = express.Router();
const saltRounds = 10;

const db = new PG.Client({
	connectionString: process.env.CONNECTION_STRING,
	ssl: { rejectUnauthorized: false },
});

db.connect();

router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureMessage: false,
	}),
);

router.get('/logout', (req, res) => {
	// req.logout((err) => {
	// 	if (err) {
	// 		res.send('Error logging out: ' + err);
	// 	}
	// 	res.redirect('/');
	// });
	req.session = null;
	res.redirect('/');
});

router.post('/register', async (req, res) => {
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
						res.redirect('/home');
					}
				});
			});
		}
	} catch (err) {
		console.log(err);
		res.send('Error Registering: ' + err);
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
			return cb(err, false);
		}
	}),
);

export default router;
