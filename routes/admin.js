"use strict";
var async = require("async");
var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var util = require('util');

var statsDB, postsDB, statsScraper;

var Admin = function( mongo ) {

	var self = this;
	if( typeof mongo === 'undefined' ) { console.log( 'Admin( undefined )!'); }

	var AdminUserMongo = require("../libs/AdminUserMongo").AdminUserMongo;
	self._adminUsers = new AdminUserMongo( {mongo:mongo} );

	var AdsMongo = require("../libs/AdsMongo").AdsMongo;
	self._ads = new AdsMongo( {mongo:mongo} );

	var UsersMongo = require("../libs/UsersMongo").UsersMongo;
	self._users = new UsersMongo( {mongo:mongo} );

	var StatsMongo = require("../libs/StatsMongo").StatsMongo;
	statsDB = new StatsMongo( {mongo:mongo} );

	var PostsMongo = require("../libs/PostsMongo").PostsMongo;
	postsDB = new PostsMongo( {mongo:mongo} );

	var Stats = require('../server/stats_scraper.js').initStats;
  	statsScraper = new Stats(mongo);

};

exports.initAdmin = function( mongo ){
	return new Admin( mongo );
}

Admin.prototype.admin = function( req, res ){
	
	var url = 'admin/login';
	if(req.session.loggedIn){
		url = 'admin/dashboard';
		res.locals.section = 'dashboard';
	}
	return res.redirect(url);
}

String.prototype.replaceAll = function(target, replacement) { return this.split(target).join(replacement); };

Admin.prototype.addAdmin = function( req, res ) {
	return res.render('admin/addadmin');
};

Admin.prototype.editAdmin = function( req, res ) {
	return res.render('admin/editadmin');
};

Admin.prototype.login = function( req, res ) {
	return res.render('admin/login');
};

Admin.prototype.manageAdmins = function( req, res ) {
	return res.render('admin/adminmanager');
};

Admin.prototype.postLogin = function( req, res ) {
	var self = this;
	var user = req.body['admin'];
	self._adminUsers.authenticate(user.id, user.password, function (error, result) {
		console.log(error + "  !!!!");
		if (error !== null || !result) {
			req.session.admin = {loggedIn:false};
			return res.redirect('/admin/login');
		}
		var url = 'admin/dashboard';
		result.pwd = null;
		req.session.admin = result;
		req.session.loggedIn = true;
		res.redirect(url);
	});
};

Admin.prototype.logOut = function( req, res ) {
	req.session.admin = null;
	req.session.loggedIn = false;
	res.locals.admin = null;
  	res.locals.loggedIn = false;
	res.render('admin/login');
};

Admin.prototype.dashboard = function( req, res ){
	console.log(req.session.loggedIn);
	res.locals.loggedIn = req.session.loggedIn;
	res.locals.section = 'dashboard';
	res.render('admin/dashboard');
}

Admin.prototype.ads = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	this._ads.getAll(function(error, docs){
		res.locals.adsJSON = docs;
		res.locals.section = 'manage_ads';
		res.render('admin/manage_ads');
	});	
}

Admin.prototype.users = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	this._users.getAll(function(error, docs){
		// console.log(docs);
		res.locals.usersJSON = docs;
		res.locals.section = 'manage_users';
		res.render('admin/manage_users');
	});	
}

Admin.prototype.posts = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	postsDB.getAll(function(error, docs){
		// console.log(docs);
		res.locals.postsJSON = docs;
		res.locals.section = 'manage_posts';
		res.render('admin/manage_posts');
	});	
}

Admin.prototype.editPostFromId = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	
	var o_id = new BSON.ObjectID(req.params.postId);

	postsDB.findOne({"_id": o_id }, function(error, doc){
		res.locals.post = doc;
		res.render('blog_new_post', { title: "Chromemote - Blog | Edit Post", pageName: "blog" });
	});
}


Admin.prototype.editPostFromPath = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	
	postsDB.findOne({"path": req.params.pathString }, function(error, doc){
		res.locals.post = doc;
		res.render('blog_new_post', { title: "Chromemote - Blog | Edit Post", pageName: "blog" });
	});
}


Admin.prototype.updatePost = function( req, res ){
	// console.log(req.body.donation);	

	var obj = {};    
    postsDB.updatePost(req.body, function(error, doc){
		var obj = {};
    	obj.msg = "OK";

    	obj.body  = doc.body;	
    	obj.date  = doc.date;
    	obj.id 	  = doc.id;
    	obj.live  = doc.live;
    	obj.path  = doc.path;
    	obj.title = doc.title;

    	res.send(obj);
	});
    
}

Admin.prototype.removePost = function( req, res ){
	// console.log(req.body.donation);	

	var o_id = new BSON.ObjectID(req.body.dbID);

	var obj = {};
    var data = {};
    data._id = o_id;
    postsDB.remove(data, function(){
    	obj = {"msg": "OK"};
    	res.send(obj);
    });
    
    
}

Admin.prototype.newPost = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	var doc = [];
	doc.push({});
	doc[0].title = "New Blog Post Title";
	doc[0].date = getTodaysDate() + " " + getCurrentTime();
	doc[0].body = "<p>New blog post body text goes here.</p>\n\n<style></style>\n\n<script></script>";
	res.locals.post = doc;
	res.render('blog_new_post',  { title: "Chromemote - Blog | New Post", pageName: "blog" });


}


Admin.prototype.addNewPost = function( req, res ){
	
	console.log(req.body);

	var data = {};
	data.title= req.body.title;
	data.path = req.body.title.toLowerCase().replaceAll(" ","-");
	data.date = req.body.date;
	data.body = req.body.body;
	data.live = req.body.live;	
    
	postsDB.insertAndReturn(data, function(doc){    	
    	var obj = {};
    	obj = doc;
    	obj.msg = "OK";
    	res.send(obj);
    });
}

Admin.prototype.publishPost = function( req, res ){
	var obj = {};
    postsDB.setPublishedStatus(req.body.dbID, req.body.live, function(){});
    obj = {"msg": "OK"};
    res.send(obj);
}

Admin.prototype.getStats = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	this._users.getAll(function(error, docs){
		console.log(error);
		if(docs!=null && error==null){
			var obj = {}; 
			var payPalTotal = 0,
		        amazonTotal = 0,
		        googleTotal = 0,
		        stripeTotal = 0,
		        proUserTotal = docs.length,
		        amountTotal = 0,
		        weeklyTotal = 0,
		        donationAvg = 0,
		        donationTotal = 0;

		    for(var i=0; i<docs.length; i++){
		    	for(var n=0; n<docs[i].donation.length; n++){
			    	amountTotal = amountTotal + docs[i].donation[n].amount;
			    	if(docs[i].donation[n].source == "paypal") payPalTotal++;
				    if(docs[i].donation[n].source == "amazon") amazonTotal++;
				    if(docs[i].donation[n].source == "google_wallet") googleTotal++;
				    if(docs[i].donation[n].source == "stripe") stripeTotal++;
			    }		    
		    }
		    donationTotal = payPalTotal+amazonTotal+googleTotal+stripeTotal;

		    donationAvg = (amountTotal/(donationTotal)).toFixed(2);
		    
		    statsDB.getAll(function(err, docs){
		    	// console.log(docs);
		    	docs.sort(function(a,b) { return (new Date(b.date)) - (new Date(a.date)) } );

		    	var weeklyUsers = [];
		    	for(var i=0; i<docs.length; i++){
		    		delete docs[i]._id;
		    	}
		    	if(docs.length > 0) {
		    		for(var i=docs.length-1; i>=0; i--){
		    			weeklyUsers.push( docs[i] );
		    		}
		    	}

		    	obj = {	
		    			"proUserTotal" : proUserTotal,
					   	"amountTotal"  : amountTotal,
					   	"payPalTotal"  : payPalTotal,
					   	"amazonTotal"  : amazonTotal,
					   	"googleTotal"  : googleTotal,
					   	"stripeTotal"  : stripeTotal,
					   	"donationTotal": donationTotal,
					   	"donationAvg"  : donationAvg,
					   	"weeklyUsers"  : weeklyUsers
					  };
			    res.send(obj);
		    });
		}	    
	});	
}

Admin.prototype.getAdItemHTML = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	//console.log(req.body.adsJSON);
	res.locals.adsJSON = req.body.adsJSON;
	res.render('admin/partials/manage_ads_ad');
}

Admin.prototype.getUserItemHTML = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	res.locals.usersJSON = req.body.usersJSON;
	res.render('admin/partials/manage_users_user');
}

Admin.prototype.manage_admins = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	res.render('admin/manage_admins');
}

Admin.prototype.createPwd = function( req, res ){
	var pwd = req.params.pwd;
	var bcrypt = require('bcrypt-nodejs'); 
	
	var salt = bcrypt.genSaltSync(10);
	var password = bcrypt.hashSync(pwd, salt);
	res.send({string:pwd, password:password});
}

var keyGen = require('../private/js/keygen.js');

Admin.prototype.keyGen = function( req, res ){
	var email = req.params.email;

	var key = keyGen.getKey( email );

	res.send({email:email, key:key});
}

Admin.prototype.enabledAd = function( req, res ){
	var obj = {};
    this._ads.setEnabledStatus(req.body.dbID, req.body.status, function(){});
    obj = {"msg": "OK"};
    res.send(obj);
}

Admin.prototype.updateUser = function( req, res ){
	// console.log(req.body.donation);
	var obj = {};    
    this._users.updateUser(req.body.dbID, req.body.name, req.body.email, req.body.donation, function(){});
    obj = {"msg": "OK"};
    res.send(obj);
}

Admin.prototype.updateOrder = function( req, res ){
	var obj = {};    
    this._ads.updateOrder(req.body.dbID, req.body.order, function(){});
    obj = {"msg": "OK"};
    res.send(obj);
}

Admin.prototype.addNewAd = function( req, res ){
	var adData = {};
	adData.order  = req.body.order;
	adData.img = req.body.imageUrl;
	adData.url  = req.body.linkUrl;
	adData.clicks = 0;
	adData.enabled_status  = 0;    
    this._ads.insertAndReturn(adData, function(doc){    	
    	var obj = {};
    	obj = doc;
    	obj.msg = "OK";
    	res.send(obj);
    });
}

Admin.prototype.removeAd = function( req, res ){
	var o_id = new BSON.ObjectID(req.body.dbID);

	var obj = {};
    var data = {};
    data._id = o_id;
    this._ads.remove(data, function(){});
    obj = {"msg": "OK"};

    res.send(obj);
}




Admin.prototype.addNewUser = function( req, res ){

	var userData = {};

	userData.name  = req.body.name;
	userData.email = req.body.email;
	userData.donation  = req.body.donation;
	userData.date_added  = req.body.date_added;
	userData.product_key  = keyGen.getKey( req.body.email );
    
    this._users.insertAndReturn(userData, function(doc){
    	
    	var obj = {};
    	obj = doc;
    	obj.msg = "OK";
    	res.send(obj);

    });
    
}

Admin.prototype.removeUser = function( req, res ){
	var o_id = new BSON.ObjectID(req.body.dbID);

	var obj = {};
    var data = {};
    data._id = o_id;
    this._users.remove(data, function(){});

    obj = {"msg": "OK"};

    res.send(obj);

}

Admin.prototype.privateScript = function( req, res ) {
	var filePath = './private/js/' + req.params.scriptFileName;
	return res.sendfile(filePath);
}
Admin.prototype.privateStyle = function( req, res ) {
	var filePath = './private/css/' + req.params.styleFileName;
	return res.sendfile(filePath);
}
Admin.prototype.privateImage = function( req, res ) {
	var filePath = './private/images/' + req.params.imageFileName;
	return res.sendfile(filePath);
}



function getTodaysDate(){
    var dateNow = new Date(),
    todaysMonth = dateNow.getMonth()+1,
    todaysDay   = dateNow.getDate(),
    todaysYear  = dateNow.getFullYear();

    if(todaysMonth < 10) todaysMonth = "0"+todaysMonth;
    if(todaysDay < 10) todaysDay = "0"+todaysDay;

    return todaysYear + "/" + todaysMonth + "/" + todaysDay;
}

function getCurrentTime(){

	var date = new Date();

    var currentHour = date.getHours(),
    currentMin  = date.getMinutes();

    if(parseInt(currentHour) < 10) currentHour = "0"+currentHour;
    if(currentMin < 10) currentMin = "0"+currentMin;

    return currentHour + ":" + currentMin;
}


Admin.prototype.pullCWS = function( req, res ){
	res.locals.loggedIn = req.session.loggedIn;
	
	
  	statsScraper.scrapeStats();

  	return true;
}