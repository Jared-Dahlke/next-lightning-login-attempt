// pages/api/hello.js
import nc from 'next-connect'
import passport from 'passport'
const MongoStore = require('connect-mongo')
const LnurlAuth = require('passport-lnurl-auth')
const session = require('cookie-session')

const mongoOptions = {
	//httpOnly: false,
	mongoUrl:
		'mongodb+srv://username:password@gitlabgo-nbdkt.mongodb.net/BuySellBitcoinInPersonDev?retryWrites=true&w=majority'
}

const config = {
	host: 'localhost',
	port: 3000,
	url: 'localhost:3000'
}

const handler = nc({
	onError: (err, req, res, next) => {
		console.error(err)
		res.status(500).end('Something broke!')
	},
	onNoMatch: (req, res) => {
		res.status(404).end('Page is not found')
	}
})

handler.use(
	session({
		secret: '1jlfaksdjlfajkdl2345',
		store: MongoStore.create(mongoOptions),
		resave: false,
		saveUninitialized: true,
		cookie: {
			// path: "/",//if / the cookies will be sent for all paths
			httpOnly: false, // if true, the cookie cannot be accessed from within the client-side javascript code.
			//secure: true, // true->cookie has to be sent over HTTPS
			maxAge: 2 * 24 * 60 * 60 * 1000
			//sameSite: 'none' //- `none` will set the `SameSite` attribute to `None` for an explicit cross-site cookie.
		}
	})
)

handler.use(passport.initialize())
handler.use(passport.session())

const map = {
	user: new Map()
}

passport.serializeUser(function (user, done) {
	done(null, user.id)
})

passport.deserializeUser(function (id, done) {
	done(null, map.user.get(id) || null)
})

passport.use(
	new LnurlAuth.Strategy(function (linkingPublicKey, done) {
		let user = map.user.get(linkingPublicKey)
		if (!user) {
			user = { id: linkingPublicKey }
			map.user.set(linkingPublicKey, user)
		}
		done(null, user)
	})
)

handler.use(passport.authenticate('lnurl-auth'))

// handler.get(function (req, res) {
// 	if (!req.user) {
// 		return res.send(
// 			'You are not authenticated. To login go <a href="/login">here</a>.'
// 		)
// 		// return res.redirect('/login');
// 	}
// 	res.send('Logged-in')
// })

handler.get(
	function (req, res, next) {
		//console.log('here34', req)
		console.log('req.user', req.user)
		if (req.user) {
			//	console.log('here35')
			// Already authenticated.
			return res.redirect('http://localhost:3000/home')
		}
		next()
	},
	new LnurlAuth.Middleware({
		callbackUrl: config.url + '/api/auth',
		cancelUrl: 'http://localhost:3000/',
		serverless: true,
		recordLoginSuccess: async (k1, pubkey) => {
			console.log('recordlogin', k1, pubkey)
			// connect to your DB and store the k1 string and pubkey
			//  await dbConnect();
			// const attempt = new LoginAttempt({ k1, nodePubKey: pubkey });
			// await attempt.save();
		},
		// this method gets called by the client login page polls to check if the login was successful
		checkLoginSuccess: async (k1) => {
			console.log('checklogin', k1)
			//  await dbConnect();
			//  const attempt = await LoginAttempt.findOne({ k1 });
			// existence check, if there is no entry in your DB then we did not succesfully login
			// if (attempt) {
			//   const pubKey = attempt.nodePubKey;
			//   await attempt.delete();
			//   return pubKey;
			// }
			// return "";
		}
		//loginTemplateFilePath: '././pages/api/login.html'
	})
)

handler.get('/user', (req, res) => {
	res.send(req.user)
})

handler.get('/logout', function (req, res, next) {
	if (req.user) {
		req.session.destroy()
		res.json({ message: 'user logged out' })
		// Already authenticated.
		//	return res.redirect('http://localhost:3000/')
	}
	next()
})

export default handler
