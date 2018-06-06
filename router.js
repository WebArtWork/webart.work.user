const User = require(__dirname+'/schema.js');
const gm = require('gm').subClass({ imageMagick: true });

module.exports = function(sd) {
	var router = sd._initRouter('/api/user');
	/*
	*	/api/photo/get
	*	custom  query below code
	*/
		sd['select_get_user'] = function(req, res){
			return '-password -usernameL';
		};
		sd['query_get_user'] = function(req, res){
			return {}
		};
	
	/*
	*	/api/photo/update/all
	*	custom  query below code
	*/
		sd['query_update_all_user'] = function(req, res){
			return {
				_id: req.user._id
			};
		};
		let ensure_super = sd['ensure_update_all_user_super'] = function(req, res, next){
			if(req.user&&req.user.is&&req.user.is.super) next();
			else res.json(false);
		};
		let ensure_admin = function(req, res, next){
			if(req.user&&req.user.is&&req.user.is.admin) next();
			else res.json(false);
		};
		sd['query_update_all_user_super'] = function(req, res){
			return {
				_id: req.body._id
			};
		};
	/*
	*	Custom Routes
	*/
		router.post("/save_is", ensure_admin, function(req, res) {
			User.findOne({
				_id: req.body._id
			}, function(err, user) {
				if (err || !user) return res.json(false);
				if(!user.is) user.is={};
				for (var i = 0; i < req.user.architect.length; i++) {
					if(req.body.is[req.user.architect[i]]){
						user.is[req.user.architect[i]] = true;
					}else{
						user.is[req.user.architect[i]] = null;
					}
				}
				user.markModified('is');
				user.save(function(){
					res.json(true);
				});
			});			
		});
		router.post("/delete_user", ensure_super, function(req, res) {
			User.remove({
				_id: req.body._id
			}, (err) => res.json(true) );
		});
	/*
	*	Custom Routes
	*/
		router.get("/me", function(req, res) {
			if(!req.user) return res.json({
				links: req.session.links||[],
				lists: req.session.lists,
				lang: 'en'
			});
			if(!req.user.lists||req.user.lists.length==0) req.user.lists=sd.defaultList;
			res.json({
				selectedList: req.session.selectedList||req.user.lists[0].id,
				free_time_experience: req.user.free_time_experience,
				study_experience: req.user.study_experience,
				work_experience: req.user.work_experience,
				pinnedTags: req.user.pinnedTags,
				available: req.user.available,
				databases: req.user.databases,
				avatarUrl: req.user.avatarUrl,
				architect: req.user.architect,
				username: req.user.username,
				position: req.user.position,
				birthday: req.user.birthday,
				stickers: req.user.stickers,
				country: req.user.country,
				perHour: req.user.perHour,
				address: req.user.address,
				devices: req.user.devices,
				links: req.user.links||[],
				socials: req.user.socials,
				skills: req.user.skills,
				region: req.user.region,
				photos: req.user.photos,
				icons: req.user.icons,
				fonts: req.user.fonts,
				ptags: req.user.ptags,
				phone: req.user.phone,
				lists: req.user.lists,
				likes: req.user.likes,
				city: req.user.city,
				tags: req.user.tags,
				lang: req.user.lang,
				name: req.user.name,
				loc: req.user.loc,
				bio: req.user.bio,
				pre: req.user.pre,
				_id: req.user._id,
				is: req.user.is
			});
		});
		router.post("/disconnect", sd._ensure, function(req, res) {
			req.user.socials[req.body.social] = null;
			req.user.save(function(){
				res.json(true);
			});
		});
		router.post("/changePassword", sd._ensure, function(req, res) {
			if (req.user.validPassword(req.body.old_pass)){
				req.user.password = req.user.generateHash(req.body.new_pass);
				req.user.save(function(){
					res.json(true);
				});
			}else res.json(false);
		});
		router.post("/change_email", sd._ensure, function(req, res) {
			if (req.user.validPassword(req.body.user_pass)){
				sd.User.findOne({
					usernameL: req.body.user_email.toLowerCase()
				}, function(err, user){
					if(err||user) return res.json(false);
					req.user.username = req.body.user_email;
					req.user.usernameL = req.body.user_email.toLowerCase();
					req.user.save(function(){
						res.json(true);
					});
				});
			}else res.json(false);
		});
		router.post("/changeAvatar", sd._ensure, function(req, res) {
			var base64Data = req.body.dataUrl.replace(/^data:image\/png;base64,/,'').replace(/^data:image\/jpeg;base64,/,'');
			var decodeData=new Buffer(base64Data,'base64');
			var fileName = req.user.email||req.user.username + "_" + Date.now() + '.jpg';
			req.user.avatarUrl = '/api/user/avatar/'+fileName+'?'+Date.now();
			fileName = __dirname + '/files/' + fileName;
			sd._fs.writeFile(fileName, decodeData, function(err) {
				gm(fileName).resize(300, 300).noProfile().write(fileName, function(err) {
					req.user.save(function(){
						res.json(req.user.avatarUrl);
					});
				});
			});
		});
		router.get("/avatar/:file", function(req, res) {
			if (sd._fs.existsSync(__dirname + '/files/' + req.params.file)) {
				res.sendFile(__dirname + '/files/' + req.params.file);
			}else res.sendFile(__dirname + '/avatar.jpg');
		});
		router.get("/default.jpg", function(req, res) {
			res.sendFile(__dirname + '/avatar.jpg');
		});
	/*
	*	End of Routes
	*/
};