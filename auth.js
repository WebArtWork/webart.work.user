var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = require(__dirname+'/schema.js');
var Recaptcha = require('express-recaptcha').Recaptcha;
var recaptcha = new Recaptcha('6LcR5FAUAAAAAO9T7GLmIsdNGlGiV90tV_ZGZjbE', '6LcR5FAUAAAAAK4a-f5MLe82LpdmChIhD3YgvSrO');

module.exports = function(sd) {
	// Initialize
		const social_base = "/Profile";
		const router = sd._initRouter('/api/user');
		if(mongoose.connection.readyState==0){
			mongoose.connect(sd._mongoUrl);
			mongoose.Promise = global.Promise;
		}
		sd._passport.serializeUser(function(user, done) {
			done(null, user.id);
		});
		sd._passport.deserializeUser(function(id, done) {
			User.findById(id, function(err, user) {
				done(err, user);
			});
		});
		router.get('/logout', function(req, res) {
			req.logout();
			res.redirect('/Auth');
		});
		router.post('/logout', function(req, res) {
			req.logout();
			res.json(true);
		});
	// Login
		if(sd._config.passport.local){
			router.post('/login', sd._passport.authenticate('local-login', {
				successRedirect: '/',
				failureRedirect: '/Auth'
			}));
			sd._passport.use('local-login', new LocalStrategy({
				usernameField : 'username',
				passwordField : 'password',
				passReqToCallback : true
			}, function(req, username, password, done) {
				User.findOne({
					'username' :  username.toLowerCase()
				}, function(err, user) {
					if (err) return done(err);
					if (!user) return done(null, false);
					if (!user.validPassword(password)) return done(null, false);
					return done(null, user);
				});
			}));
			router.post('/signup', sd._passport.authenticate('local-signup', {
				successRedirect: '/Welcome',
				failureRedirect: '/Auth'
			}));
			sd._passport.use('local-signup', new LocalStrategy({
				usernameField : 'username',
				passwordField : 'password',
				passReqToCallback : true
			}, function(req, username, password, done) {
				recaptcha.verify(req, function(error) {
					req.session.wrong_pass = true;
					if (error) return done(true);
					User.findOne({
						'username':username.toLowerCase()
					},function(err, user) {
						if (err) return done(err);
						if (user) return done(null, false);
						else {
							delete req.session.wrong_pass;
							var newUser = new User();
							newUser.lists = req.session.lists;
							newUser.links = req.session.links;
							newUser.username = username;
							newUser.usernameL = username.toLowerCase();
							newUser.fullName = req.body.fullName;
							newUser.email = req.body.email;
							newUser.password = newUser.generateHash(password);
							newUser.profileUrl = 'id'+Date.now();
							newUser.save(function(err) {
								if (err) throw err;
								return done(null, newUser);
							});
						}
					});
				});
			}));
		}
	// Facebook
		if(sd._config.passport.facebook){
			var FacebookStrategy = require('passport-facebook').Strategy;
			router.get('/facebook', sd._passport.authenticate('facebook', {
				display: 'page',
				scope: 'email'
			}));
			router.get('/facebook/callback', sd._passport.authenticate('facebook', {
				failureRedirect: social_base
			}), function(req, res) {
				res.redirect(social_base);
			});
			sd._passport.use('facebook',new FacebookStrategy({
				clientID: sd._config.passport.facebook.clientID,
				clientSecret: sd._config.passport.facebook.clientSecret,
				callbackURL: sd._config.passport.facebook.callbackURL,
				profileFields: ['id', 'profileUrl'],
				passReqToCallback:true
			}, function (req, token, refreshToken, profile, done) {
				if(req.user){
					process.nextTick(function() {
						if (!req.user) return done(true);
						if(!req.user.socials) req.user.socials={};
						req.user.socials.facebook = {
							profileUrl: profile.profileUrl,
							id: profile.id
						};
						req.user.save(function() {
							done(null, req.user);
						});
					});
				}else login('facebook', profile.id, done);
			}));
		}
	// Twitter
		if(sd._config.passport.twitter){
			var TwitterStrategy = require('passport-twitter').Strategy;
			sd._passport.use(new TwitterStrategy({
				consumerKey: sd._config.passport.twitter.consumerKey,
				consumerSecret: sd._config.passport.twitter.consumerSecret,
				callbackURL: sd._config.passport.twitter.callbackURL,
				passReqToCallback:true
			}, function(req, token, tokenSecret, profile, done) {
				if(req.user){
					process.nextTick(function() {
						if(!req.user) return done(true);
						if(!req.user.socials) req.user.socials={};
						req.user.socials.twitter = {
							id: profile.id,
							username: profile.username,
						}
						req.user.save(function(){
							done(null, req.user);
						});
					});
				}else login('facebook', profile.id, done);
			}));
			router.get('/twitter', sd._passport.authenticate('twitter'));
			router.get('/twitter/callback', sd._passport.authenticate('twitter', {
				successRedirect: social_base,
				failureRedirect: social_base
			}),function(req, res) {
				res.redirect(social_base);
			});
		}
	// Google
		if (sd._config.passport.google) {
			var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
			router.get('/google', sd._passport.authenticate('google', {
				scope: ['profile', 'email']
			}));
			router.get('/google/callback', sd._passport.authenticate('google', {
				successRedirect: '/',
				failureRedirect: '/'
			}));
			sd._passport.use('google', new GoogleStrategy({
				clientID: sd._config.passport.google.clientID,
				clientSecret: sd._config.passport.google.clientSecret,
				callbackURL: sd._config.passport.google.callbackURL,
				passReqToCallback: true
			}, function(req, token, refreshToken, profile, done) {
				if (req.user) {
					process.nextTick(function() {
						if (!req.user) return done(true);
						if (!req.user.socials) req.user.socials = {};
						req.user.socials.google = {
							id: profile.id,
							url: profile._json.url,
						}
						req.user.save(function() {
							done(null, req.user);
						});
					});
				} else login('google', profile.id, done);
			}));
		}
	// Instagram
		if(sd._config.passport.instagram){
			var InstagramStrategy = require('passport-instagram').Strategy;
			router.get('/instagram',
				sd._passport.authenticate('instagram')
			);
			router.get('/instagram/callback', sd._passport.authenticate('instagram', {
				failureRedirect: '/login'
			}), function(req, res) {
				res.redirect('/');
			});
			sd._passport.use('instagram', new InstagramStrategy({
				clientID : sd._config.passport.instagram.clientID,
				clientSecret : sd._config.passport.instagram.clientSecret,
				callbackURL : sd._config.passport.instagram.callbackURL,
				passReqToCallback: true
			}, function (req, accessToken, refreshToken, profile, done) {
				if (req.user) {
					process.nextTick(function() {
						if (!req.user) return done(true);
						if (!req.user.socials) req.user.socials = {};
						req.user.socials.instagram = {
							id: profile.id,
							username: profile.username,
						}
						req.user.save(function() {
							done(null, req.user);
						});
					});
				} else login('instagram', profile.id, done);
			}));
		}
	// VK
		if(sd._config.passport.vkontakte){
			var VKontakteStrategy = require('passport-vkontakte').Strategy;
			router.get('/vk',
				sd._passport.authenticate('vkontakte')
			);
			router.get('/vk/callback', sd._passport.authenticate('vkontakte', {
				failureRedirect: '/login'
			}), function(req, res) {
				res.redirect('/');
			});
			sd._passport.use('vkontakte', new VKontakteStrategy({
				clientID : sd._config.passport.vkontakte.clientID,
				clientSecret : sd._config.passport.vkontakte.clientSecret,
				callbackURL : sd._config.passport.vkontakte.callbackURL,
				passReqToCallback: true
			}, function (req, accessToken, refreshToken, profile, done) {
				if (req.user) {
					process.nextTick(function() {
						if (!req.user) return done(true);
						if (!req.user.socials) req.user.socials = {};
						req.user.socials.vkontakte = {
							id: profile.id,
							profileUrl: profile.profileUrl,
						}
						req.user.save(function() {
							done(null, req.user);
						});
					});
				} else login('vkontakte', profile.id, done);
			}));
		}
	// OK
		if(sd._config.passport.odnoklassniki){
			var OdnoklassnikiStrategy = require('passport-odnoklassniki').Strategy;
			router.get('/ok', sd._passport.authenticate('odnoklassniki'));
			router.get('/ok/callback', sd._passport.authenticate('odnoklassniki', {
				failureRedirect: '/login'
			}), function(req, res) {
				res.redirect('/');
			});
			sd._passport.use('odnoklassniki', new OdnoklassnikiStrategy({
				clientID : sd._config.passport.odnoklassniki.clientID,
				clientPublic: sd._config.passport.odnoklassniki.clientPublic,
				clientSecret : sd._config.passport.odnoklassniki.clientSecret,
				callbackURL : sd._config.passport.odnoklassniki.callbackURL,
				passReqToCallback:true
			}, function (req, accessToken, refreshToken, profile, done) {
				if (req.user) {
					process.nextTick(function() {
						if (!req.user) return done(true);
						if (!req.user.socials) req.user.socials = {};
						req.user.socials.odnoklassniki = {
							id: profile.id,
							profileUrl: profile.profileUrl,
						}
						req.user.save(function() {
							done(null, req.user);
						});
					});
				} else login('odnoklassniki', profile.id, done);
			}));
		}
	// End of Crud
};