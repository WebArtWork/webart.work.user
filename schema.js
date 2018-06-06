var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var schema = mongoose.Schema({
		lang: {type: String},
	// Populations
		databases: [{type: mongoose.Schema.Types.ObjectId, ref: 'Db'}],
		tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
		pinnedTags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
		photos: [{type: mongoose.Schema.Types.ObjectId, ref: 'Photo'}],
		stickers: [{type: mongoose.Schema.Types.ObjectId, ref: 'Svg'}],
		icons: [{type: mongoose.Schema.Types.ObjectId, ref: 'Svg'}],
		fonts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Font'}],
		packs: [{type: mongoose.Schema.Types.ObjectId, ref: 'Pack'}],
	// User Data
		username: {type: String, unique: true},
		usernameL: {type: String, unique: true, sparse: true, trim: true},
		password: {type: String},
		position: {type: String},
		city: {type: String},
		country: {type: String},
		address: {type: String},
		region: {type: String},
		phone: {type: String},
		available: {type: String},
		devices: [{type: String}],
		skills: [{type: String}],
		free_time_experience: [{
			title: String,
			overview: String,
			thumb: String,
			requiremenets: String,
			position: String,
			start: Date,
			end: Date,
			endYet: Boolean,
			website: String
		}], study_experience: [{
			title: String,
			overview: String,
			thumb: String,
			requiremenets: String,
			position: String,
			start: Date,
			end: Date,
			endYet: Boolean,
			website: String
		}], work_experience: [{
			title: String,
			overview: String,
			thumb: String,
			requiremenets: String,
			position: String,
			start: Date,
			end: Date,
			endYet: Boolean,
			website: String
		}], birthday: {type: Date},
		loc: {
			lat: Number,
			long: Number,
		}, bio: {type: String},
		name: {type: String},
		avatarUrl: {type: String, default: '/api/user/default.jpg'},
		perHour: {type: Number},
		likes: [String],
	// PageFly
		lists: [{
			name: String,
			id: Number,
			resolutions: [{
				w: Number,
				h: Number,
				name: String,
				icon: String
			}]
		}],
		links: [String],
	// Admin
		token: {type: String},
		architect: [String],
		is: {},
	// Prefixes
		pre: {},
		ptags: [{
			name: String,
			list: [{
				name: String
			}],
			data: {}
		}],
	// Socials
		socials:{
			facebook: {
				id: String,
				profileUrl: String
			},
			twitter: {
				id: String,
				username:String
			},
			instagram: {
				id: String,
				username:String
			},
			vkontakte: {
				id: String,
				profileUrl: String
			},
			odnoklassniki: {
				id: String,
				profileUrl: String
			},
			google: {
				id: String,
				url: String
			}
		}
	// End of schema
});
schema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
schema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.password);
};
schema.methods.update = function(newUser, callback) {
	this.free_time_experience = newUser.free_time_experience;
	this.study_experience = newUser.study_experience;
	this.work_experience = newUser.work_experience;
	this.available = newUser.available;
	this.position = newUser.position;
	this.birthday = newUser.birthday;
	this.address = newUser.address;
	this.country = newUser.country;
	this.devices = newUser.devices;
	this.skills = newUser.skills;
	this.region = newUser.region;
	this.phone = newUser.phone;
	this.city = newUser.city;
	this.name = newUser.name;
	this.loc = newUser.loc;
	this.bio = newUser.bio;
	this.ptags = newUser.ptags;
	this.pre = {};
	for (var i = 0; i < this.ptags.length; i++) {
		for(var key in this.ptags[i].data){
			this.pre[this.ptags[i].name+'_'+key] = this.ptags[i].data[key];
		}
	}
	if(newUser.token) this.token = newUser.token;
	this.save(callback);
};
module.exports = mongoose.model('User', schema);
