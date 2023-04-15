"use strict";
var async = require("async")
	, util = require('util')
	, fs = require('fs')
	, config = require('config')
	, keyGen = require('../private/js/keygen.js');

var mailInfo = config.get('mailConfig'),
	stripeInfo = config.get('stripeConfig');

var postsDB = null,
	usersDB = null,
	devsDB  = null,
	statsDB = null;

var blogPosts = require('../collections/blog-posts.json');

var Main = function( mongo ) {
	var self = this;
	if( typeof mongo === 'undefined' ) { console.log( 'Admin( undefined )!'); }

	var AdsMongo = require("../libs/AdsMongo").AdsMongo;
	self._ads = new AdsMongo( {mongo:mongo} );

	var UsersMongo = require("../libs/UsersMongo").UsersMongo;
	usersDB = new UsersMongo( {mongo:mongo} );

	var PostsMongo = require("../libs/PostsMongo").PostsMongo;
	postsDB = new PostsMongo( {mongo:mongo} );

	var DevsMongo = require("../libs/DevsMongo").DevsMongo;
	devsDB = new DevsMongo( {mongo:mongo} );

	var StatsMongo = require("../libs/StatsMongo").StatsMongo;
	statsDB = new StatsMongo( {mongo:mongo} );
};


exports.initMain = function( mongo ){
	return new Main( mongo );
};


Main.prototype.home = function( req, res, next ){
	
	res.render('index',  { title: "Chromemote - The Google TV Remote for Chrome", pageName: "home" });
	
};

Main.prototype.update = function( req, res, next ){
	
	res.render('update',  { title: "Chromemote - Update", pageName: "update" });
	
};

Main.prototype.press = function( req, res, next ){
	
	res.render('press',  { title: "Chromemote - Press", pageName: "update" });
	
};


Main.prototype.contribute = function( req, res, next ){
	
	// usersDB.getAll(function(error, docs){
		//console.log(error);
		// if(docs!=null && error==null){
			var stats = {}; 
			var payPalTotal = 0,
		        amazonTotal = 0,
		        googleTotal = 0,
		        stripeTotal = 0,
		        proUserTotal = 0,//docs.length,
		        amountTotal = 0,
		        weeklyTotal = 0,
		        donationAvg = 0,
		        donationTotal = 0;

		    // for(var i=0; i<docs.length; i++){
		    // 	for(var n=0; n<docs[i].donation.length; n++){
			   //  	amountTotal = amountTotal + parseInt(docs[i].donation[n].amount);
			   //  	if(docs[i].donation[n].source == "paypal") payPalTotal++;
				  //   if(docs[i].donation[n].source == "amazon") amazonTotal++;
				  //   if(docs[i].donation[n].source == "google_wallet") googleTotal++;
				  //   if(docs[i].donation[n].source == "stripe") stripeTotal++;
			   //  }		    
		    // }
		    donationTotal = payPalTotal+amazonTotal+googleTotal+stripeTotal;

		    

		    donationAvg = (amountTotal/(donationTotal)).toFixed(2);

		    // console.log("donationAvg "+ donationAvg);

		    // statsDB.getAll(function(err, docs){
		    	//console.log(docs);

		    	// docs.sort(function(a,b) { return (new Date(b.date)) - (new Date(a.date)) } );
		    	
		    	var weeklyUsers = [];
		    	// for(var i=0; i<docs.length; i++){
		    	// 	delete docs[i]._id;
		    	// }
		    	// if(docs.length > 0) {
		    	// 	for(var i=docs.length-1; i>=0; i--){
		    	// 		weeklyUsers.push( docs[i] );
		    	// 	}
		    	// }

		    	var weeklyStat = weeklyUsers[weeklyUsers.length-1];
		    	var weeklyUserCount = weeklyStat && weeklyStat.users ? weeklyStat.users : 0;
		    	var percentageToGoal = (amountTotal / weeklyUserCount) * 100;


		    	stats = {	
		    			"proUserTotal" : commafy(proUserTotal),
		    			"weeklyUserCount"  : commafy(weeklyUserCount),
		    			"donationTotal": commafy(donationTotal),
		    			"donationAvg"  : donationAvg,
					   	"amountTotal"  : commafy(amountTotal.toFixed(2)),
					   	"percentageToGoal"  : percentageToGoal
					  };
			    
			    res.render('contribute',  { title: "Chromemote - Contribute cash, code, or comments.", pageName: "contirbute", stats: stats });
		    // });
		// }	    
	// });	

	
	
};

function commafy(nStr){
        var nStr = nStr + '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
        return x1 + x2;
}

Main.prototype.thankYou = function( req, res, next ){
	
	res.render('thank_you',  { title: "Chromemote - Thanks!", pageName: "contirbute" });
	
};
Main.prototype.tipjar = function( req, res, next ){
	res.redirect('/support-us');
};
Main.prototype.inTheMedia = function( req, res, next ){
	res.redirect('/press');
};
Main.prototype.payPalIPN = function( req, res, next ){
	
	// Must respond to PayPal IPN request with an empty 200 first, if using Express uncomment the following:
	res.send(200);
	// console.log(req.body);
	var data = req.body;
	try{
		var userData = {};
		userData.name  = data.address_name;
		userData.email = data.payer_email;
		userData.donation  = { date: getTodaysDate(), amount: data.mc_gross, source: "paypal" };
		userData.date_added  = getTodaysDate();
		userData.product_key  = keyGen.getKey( data.payer_email );
	    
	    usersDB.insertAndReturn(userData, function(doc){		    	
	    	var emailjs   = require("emailjs");
			var server  = emailjs.server.connect({
			   user:     mailInfo.user, 
			   password: mailInfo.password,
			   host:     mailInfo.host, 
			   ssl:     true

			});

			// send the message and get a callback with an error or details of the message that was sent
			server.send({
			   text:    "Thanks so much for your contribution to Chromemote. \n\nI have included in this email " +
			   			"an activation key that you can enter into Chromemote's settings to allow you the ability "+
			   			"to turn off the ads. Feel free to leave them enabled as another way to continue support. :)\n\n"+
			   			"User Account:\t"+ userData.email + "\n"+
			   			"Product Key: \t"+ userData.product_key+ "\n\n"+
			   			"Thanks Again,\nRobert Dale Smith\nChromemote Developer\nwww.Chromemote.com \n\n\n"+
			   			"ps. If you enjoy using Chromemote, then please give us a review on the Chrome Web Store: \n https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted/reviews", 
			   from:    "Robert Smith with Chromemote <robert@chromemote.com>", 
			   to:      userData.name + " <" + userData.email + ">",
			   cc:      "",
			   subject: "Thank You from Chromemote (Activation Key)"
			}, function(err, message) { /*console.log(err || message);*/ });
	    });	
	} catch(e){ }

	// var ipn = require('paypal-ipn');

	// ipn.verify(req.body, function callback(err, msg) {
	// 	if (err) {
	// 		console.error(msg);
	// 	} else {
	// 		//Do stuff with original params	 here

	// 		if (params.payment_status == 'Completed') {
	// 		  	//Payment has been confirmed as completed

			  	
	// 		}

	// 	}


	// });

	
};

Main.prototype.payPalIPN = function( req, res, next ){
	
	// Must respond to PayPal IPN request with an empty 200 first, if using Express uncomment the following:
	res.send(200);
	console.log(req.body);
	var data = req.body;
	try{
		var userData = {};
		userData.name  = data.address_name;
		userData.email = data.payer_email;
		userData.donation  = { date: getTodaysDate(), amount: data.mc_gross, source: "paypal" };
		userData.date_added  = getTodaysDate();
		userData.product_key  = keyGen.getKey( data.payer_email );
	    
	    usersDB.insertAndReturn(userData, function(doc){		    	
	    	var emailjs   = require("emailjs");
			var server  = emailjs.server.connect({
			   user:     mailInfo.user, 
			   password: mailInfo.password,
			   host:     mailInfo.host, 
			   ssl:      true

			});

			// send the message and get a callback with an error or details of the message that was sent
			server.send({
			   text:    "Thanks so much for your contribution to Chromemote. \n\nI have included in this email " +
			   			"an activation key that you can enter into Chromemote's settings to allow you the ability "+
			   			"to turn off the ads. Feel free to leave them enabled as another way to continue support. :)\n\n"+
			   			"User Account:\t"+ userData.email + "\n"+
			   			"Product Key: \t"+ userData.product_key+ "\n\n"+
			   			"Thanks Again,\nRobert Dale Smith\nChromemote Developer\nwww.Chromemote.com \n\n\n"+
			   			"ps. If you enjoy using Chromemote, then please give us a review on the Chrome Web Store: \n https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted/reviews", 
			   from:    "Robert Smith with Chromemote <robert@chromemote.com>", 
			   to:      userData.name + " <" + userData.email + ">",
			   cc:      "",
			   subject: "Thank You from Chromemote (Activation Key)"
			}, function(err, message) { /*console.log(err || message);*/ });
	    });	
	} catch(e){ }

	
};


Main.prototype.amazonIOPN = function( req, res, next ){
	
	res.send(200);
	// console.log(req.body);
	var data = req.body;
	try{
		var userData = {};
		userData.name  = data.address_name;
		userData.email = data.payer_email;
		userData.donation  = { date: getTodaysDate(), amount: data.mc_gross, source: "paypal" };
		userData.date_added  = getTodaysDate();
		userData.product_key  = keyGen.getKey( data.payer_email );
	    
	    usersDB.insertAndReturn(userData, function(doc){		    	
	    	var emailjs   = require("emailjs");
			var server  = emailjs.server.connect({
			   user:     mailInfo.user, 
			   password: mailInfo.password,
			   host:     mailInfo.host, 
			   ssl:     true

			});

			// send the message and get a callback with an error or details of the message that was sent
			server.send({
			   text:    "Thanks so much for your contribution to Chromemote. \n\nI have included in this email " +
			   			"an activation key that you can enter into Chromemote's settings to allow you the ability "+
			   			"to turn off the ads. Feel free to leave them enabled as another way to continue support. :)\n\n"+
			   			"User Account:\t"+ userData.email + "\n"+
			   			"Product Key: \t"+ userData.product_key+ "\n\n"+
			   			"Thanks Again,\nRobert Dale Smith\nChromemote Developer\nwww.Chromemote.com \n\n\n"+
			   			"ps. If you enjoy using Chromemote, then please give us a review on the Chrome Web Store: \n https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted/reviews", 
			   from:    "Robert Smith with Chromemote <robert@chromemote.com>", 
			   to:      userData.name + " <" + userData.email + ">",
			   cc:      "",
			   subject: "Thank You from Chromemote (Activation Key)"
			}, function(err, message) { /*console.log(err || message);*/ });
	    });	
	} catch(e){ }

	
};


Main.prototype.blogHome = function( req, res, next ){
	res.locals.loggedIn = req.session.loggedIn;
	postsDB.getLivePosts(function(error, docs){
		res.locals.postsJSON = docs;
		res.render('blog_home',  { title: "Chromemote - Blog", pageName: "blog" });
	});	
};


Main.prototype.blogPost = function( req, res, next ){
	res.locals.loggedIn = req.session.loggedIn;
	var path = req.params.path;

	// postsDB.findOne({"path":{ $regex: new RegExp("^" + path.toLowerCase(), "i") }}, function(error, doc){
	// 	//console.log(doc);
	// 	if(doc.live){
	// 		res.locals.post = doc;
	// 		res.render('blog_post',  { title: "Chromemote - Blog | " + doc.title, pageName: "blog" });
	// 	} else {
	// 		res.redirect("/404");
	// 	}
	// });

	postsDB.findOnePostByPath(path.toLowerCase(), function(error, doc){
		//console.log(doc);

		if(doc.live){
			res.locals.post = doc;
			res.render('blog_post',  { title: "Chromemote - Blog | " + doc.title, pageName: "blog" });
		} else {
			res.redirect("/404");
		}
		
	});
};


Main.prototype.faq = function( req, res, next ){
	
	res.render('faq',  { title: "Chromemote - Frequently Asked Questions", pageName: "faq" });
	
};


Main.prototype.getKey = function( req, res, next ){
	
	
	res.render('get_key',  { title: "Chromemote - Activation Key", pageName: "get_key" });
	
};

Main.prototype.emailKey = function( req, res, next ){
	var email = req.body['emailAddress'];

	//Find if its in the database._user
	try{
		usersDB.getAll(function(error, docs){
			if(error)res.send({"status": -1});

			if(docs){
				var userFound = false,
				keyFound  = "",
				nameFound = "";
				//console.log(docs);
				for(var i=0; i < docs.length; i++){
					if(docs[i].email == email) {
						userFound = true;
						keyFound = docs[i].product_key;
						nameFound = docs[i].name;
					}
				}

				var userData = {};
				userData.name  = nameFound;
				userData.email = email;
				userData.product_key  = keyFound;

				if(userFound){
					var emailjs   = require("emailjs");
					var server  = emailjs.server.connect({
					   user:     mailInfo.user, 
					   password: mailInfo.password,
					   host:     mailInfo.host, 
					   ssl:     true

					});

					// send the message and get a callback with an error or details of the message that was sent
					server.send({
					   text:    "Thanks so much for your contribution to Chromemote. \n\nI have included in this email " +
						   			"an activation key that you can enter into Chromemote's settings to allow you the ability "+
						   			"to turn off the ads. Feel free to leave them enabled as another way to continue support. :)\n\n"+
						   			"User Account:\t"+ userData.email + "\n"+
						   			"Product Key: \t"+ userData.product_key+ "\n\n"+
						   			"Thanks Again,\nRobert Dale Smith\nChromemote Developer\nwww.Chromemote.com \n\n\n"+
						   			"ps. If you enjoy using Chromemote, then please give us a review on the Chrome Web Store: \n https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted/reviews", 
					   from:    "Robert Smith with Chromemote <robert@chromemote.com>", 
					   to:      userData.name + " <" + userData.email + ">",
					   cc:      "",
					   subject: "Thank You from Chromemote (Activation Key)"
					}, function(err, message) { /*console.log(err || message);*/ });


					res.send({"status": 1});
				} else {
					res.send({"status": 0});
				}
			}
			
		});	
	} catch(e){}
	//If not then send error back.

	//If it is then send an email to the user with the match product key. 
		//Then send succes message back.
	
};

Main.prototype.checkKey = function( req, res, next ){
	var email = req.body['email'],
		  key = req.body['key'] + "".toLowerCase();
		  //console.log(email);
	//Find if its in the database._user
	usersDB.findOne({"email":{ $regex: new RegExp("^" + email.toLowerCase(), "i") }}, function(error, doc){
		//console.log(doc);
		if(!doc){
			res.send({"status": 0});
		} else{
			//console.log(doc.product_key);
			//console.log(key);
			if(doc.product_key == key){
				res.send({"status": 1});
			} else {
				res.send({"status": 2});
			}

		}
		
	});	
	
};


Main.prototype.testing = function( req, res, next ){
	
	res.render('testing');
	
};

Main.prototype.redirectLink = function( req, res ){
	var linkId = req.params.linkId;
		
	this._ads.findAndIncrementAd(linkId, function(error, doc){
		//console.log(doc);
		
		if(doc)
			res.redirect(doc.url);
		else
			res.redirect("http://chromemote.com/");
		
		
	});

}

Main.prototype.getAds = function( req, res, next ){
	
	this._ads.getAllEnabled(function(error, docs){
		res.json(docs);
	});

};

Main.prototype.stripePayment = function( req, res, next ){
	
	var args = req.body['args'],
	   token = req.body['token'],
	   amount= req.body['amount'];
	//console.log(args);
	//console.log(token);
	var stripe = require('stripe')(stripeInfo.liveKey);

	// (Assuming you're using express - expressjs.com)
	// Get the credit card details submitted by the form

	var charge = stripe.charges.create({
		amount: (amount*100), // amount in cents, again
		currency: "usd",
		card: token.id,
		description: "Chromemote contributor ("+token.email+")"
	}, function(err, charge) {
		if (err && err.type === 'StripeCardError') {
			// The card has been declined
			console.log("The card has been declined");
			console.log(err);
		}else{
			console.log("Success!!");
			console.log(charge);

			stripe.customers.create( { 
				email: token.email,
				description: token.card.name + " ($" + amount + ".00)"
			},
			function(err, customer) {
				err; // null if no error occurred
				customer; // the created customer object
			});

			try{
				var userData = {};
				userData.name  = token.card.name;
				userData.email = token.email;
				userData.donation  = { date: getTodaysDate(), amount: amount, source: "stripe" };
				userData.date_added  = getTodaysDate();
				userData.product_key  = keyGen.getKey( token.email );
			    
			    usersDB.insertAndReturn(userData, function(doc){

			    	var emailjs   = require("emailjs");
					var server  = emailjs.server.connect({
					   user:     mailInfo.user, 
					   password: mailInfo.password,
					   host:     mailInfo.host, 
					   ssl:     true

					});

					// send the message and get a callback with an error or details of the message that was sent
					server.send({
					   text:    "Thanks so much for your contribution to Chromemote. \n\nI have included in this email " +
					   			"an activation key that you can enter into Chromemote's settings to allow you the ability "+
					   			"to turn off the ads. Feel free to leave them enabled as another way to continue support. :)\n\n"+
					   			"User Account:\t"+ userData.email + "\n"+
					   			"Product Key: \t"+ userData.product_key+ "\n\n"+
					   			"Thanks Again,\nRobert Dale Smith\nChromemote Developer\nwww.Chromemote.com \n\n\n"+
					   			"ps. If you enjoy using Chromemote, then please give us a review on the Chrome Web Store: \n https://chrome.google.com/webstore/detail/bhcjclaangpnjgfllaoodflclpdfcegb/publish-accepted/reviews", 
					   from:    "Robert Smith with Chromemote <robert@chromemote.com>", 
					   to:      userData.name + " <" + userData.email + ">",
					   cc:      "",
					   subject: "Chromemote Product Key Recovery Request"
					}, function(err, message) { /*console.log(err || message);*/ });

			    	var obj = {};
			    	obj = doc;
			    	obj.msg = "OK";
			    	res.send(obj);
			    });	
			} catch(e){ }
			
		}
	});
	
};

function getTodaysDate(){
    var dateNow = new Date(),
    todaysMonth = dateNow.getMonth()+1,
    todaysDay   = dateNow.getDate(),
    todaysYear  = dateNow.getFullYear();

    if(todaysMonth < 10) todaysMonth = "0"+todaysMonth;
    if(todaysDay < 10) todaysDay = "0"+todaysDay;

    return todaysYear + "/" + todaysMonth + "/" + todaysDay;
}

Main.prototype.devSignup = function( req, res ){

	var userData = {};
	userData.email = req.body.email;    
    devsDB.insertAndReturn(userData, function(doc){    	
    	var obj = {};
    	obj = doc;
    	obj.msg = "OK";
    	res.send(obj);
    });
    
}

Main.prototype.supportComment = function( req, res ){

	// console.log(req.body.name);
	// console.log(req.body.email);
	// console.log(req.body.msg);

	var emailjs   = require("emailjs");
	var server  = emailjs.server.connect({
	   user:     mailInfo.user, 
	   password: mailInfo.password,
	   host:     mailInfo.host, 
	   ssl:     true
	});

	// send the message and get a callback with an error or details of the message that was sent
	server.send({
	   text:    req.body.msg, 
	   from:    req.body.name + " <" + req.body.email + ">",
	   to:      "Robert Smith with Chromemote <robert@chromemote.com>", 
	   cc:      "",
	   subject: "Chromemote Support Comment"
	}, function(err, message) { /*console.log(err || message);*/
		res.send(message);
	});
    
}