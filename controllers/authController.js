const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');

router.get('/',(req,res) => {

 	let err;
 	let register;
 	let destPage;
 	let host;
 	if (req.get('referer')) {
 		host = req.get('referer');
 		host = host.slice(0,host.indexOf('//')+2)+req.get('host');
 	}

	err = req.session.err;
	register = req.session.register;
	req.session.err = null;

	if (req.session && req.session.dest && req.session.dest !== '/' && req.session.dest !== '/logout') {
		destPage = req.session.dest;
	}
	else if (req.get('referer') !== host+'/' && req.get('referer') !== host+'/logout') {
		destPage = req.get('referer');
	}

	res.render('auth/login.ejs', {
		errMessage: err,
		register: register,
		login: true,
		destPage: destPage
	})

})

router.get('/logout', (req,res,next) => {
	req.session.destroy();
	res.redirect('back');
})

router.post('/login', async (req,res,next) => {
	try {

		const user = await User.findOne({ username: req.body.username })
		
		if (user && bcrypt.compareSync(req.body.password,user.password)) {
			req.session.loggedIn = true;
			req.session.username = req.body.username;
			if (req.body.dest) {
				res.redirect(req.body.dest);
			}
			else {
				res.redirect('/movies');
			}
		}
		else {
			req.session.err = "Invalid username and password.",
			req.session.register = false
			res.redirect('/');
		}
	}
	catch (err) {
		next(err);
	}
})


router.post('/register', async (req,res,next) => {

	try {
		let dest = req.body.dest;
		req.body.dest = undefined;

		let { password } = req.body;
		password = bcrypt.hashSync(password,bcrypt.genSaltSync(10))
		req.body.password = password;

		const existingUser = await User.findOne({ username: req.body.username });

		if (existingUser) {
			req.session.err = "Couldn't register. Try a different username";
			req.session.register = true;
			res.redirect('/');
		}
		else {
			const user = await User.create(req.body);

			if (user) {
				req.session.loggedIn = true;
				req.session.username = req.body.username;
				if (dest) {
					res.redirect(dest);
				}
				else {
					res.redirect('/movies');
				}
			}
			else {
				req.session.err = "Couldn't register. Try again later.";
				req.session.register = true;
				res.redirect('/');
			}
		}
	}
	catch (err) {
		next(err);
	}
})

router.get('/wish', async (req, res, next) => {
	try {
		
		const foundUser = await User.findOne({username: req.session.username})
		
		const wishlist = [];
		
		for (let movie of foundUser.wishlist) {
		const Movie = require('../apidata/movie.js');

	  	// const Movie = await Movie.get({
    //     	url: 'https://api.amctheatres.com/v2/movies/'+movie.id,
    //     	headers: {
    //       		'X-AMC-Vendor-Key': process.env.API_KEY
    //     	},
    //     	method: "GET",
    //     	json: true
    //   	})
			response = Movie
			wishlist.push(response);
		}
		res.render('auth/wish.ejs', {
			user: foundUser,
			wishlist: wishlist,
			currLoc: req.session.currLoc,
        	login: false,
        	loggedIn: req.session.loggedIn
		}) 
	} catch(err){
		next(err)
	}
}) 

router.get('*',(req,res) => {
	res.redirect('/');
})

module.exports = router;