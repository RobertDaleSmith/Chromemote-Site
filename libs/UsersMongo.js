"use strict";
var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

/*
This object will take a db object.
It makes assumption that DB connection is established and authenticated.
*/
var UsersMongo = exports.UsersMongo = function(spec) {
	this.mongo = spec.mongo;
	this.users = this.mongo.getCollection('paid-users');
}

var isEmpty = function (obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) return false;
	}
	return true;
}



/*
// Methods for users
*/

UsersMongo.prototype.insert = function( user, callback ){
	this.users.insert( user, {safe:true}, function( err ){
		callback( err )
	})
}


UsersMongo.prototype.insertAndReturn = function( user, callback ){
	
	console.log(user.email);
	this.users.findOne({ $query: { email: user.email } }, function (error, userDoc) {
		if(!userDoc){
			console.log("Error: " + error);
			insert(user, callback);
		} else {
			
			user._id = userDoc._id;

			user.donation = JSON.stringify(user.donation).replace("[","").replace("]","")+","+JSON.stringify(userDoc.donation).replace("[","").replace("]","");
			user.donation = JSON.parse("[" +user.donation+ "]");
			console.log(user.donation);
			// console.log("------------");
			// console.log(user.donation);
			update(user, callback);
		}
	});

	var usersDB = this.users;


	function update(user, callback){
		// console.log("............");
		// console.log(user.donation);
		var o_id = new BSON.ObjectID(user._id+"");	

		usersDB.update(	
			{	_id: o_id 	},
			{ 	$set:{ 	donation: user.donation }
			},
			function(err, result) {
					if( err )callback( err );
					callback( [ user ] );
					console.log("Result: "+result);
			}
	  	);
	}

	
	function insert(user, callback){
		console.log(user.email);
		user.email = user.email.toLowerCase();
		usersDB.insert( user, {safe:true}, function( err, doc ){
			if( err )callback( err );
			callback( doc );
		})
	}
	
}


UsersMongo.prototype.remove = function( query, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( !query  ){
		return callback( 'No query was provided' )
	}

	if( query._id && typeof query._id !== 'object' ){
		query._id = new ObjectID( query._id );
	}
	console.log(query);
	this.users.remove( query, callback );
}



UsersMongo.prototype.findAndModifyUser = function( query, user, callback ){
	
	if( !query || typeof query === 'function' ){
		return callback( 'No query was provided' );
	}

	if( user && typeof user === 'function' ){
		return callback( 'No data was provided' );
	}
	
	// var o_id = new BSON.ObjectID(query.dbID);

	// this.users.findAndModify( query, {	'_id':o_id
	// 									'name': query.name,
 // 										'email': query.email,
 // 										'donation': query.donations}, user, {safe:true, upsert:true, new:true}, callback );

	
}



UsersMongo.prototype.findAndIncrementUser = function( userID, callback ){
	var o_id = new BSON.ObjectID(userID);
	
	this.users.findOne({ $query: { _id: o_id } }, function (error, user) {
		callback(error, user);
	});

	this.users.update(	
		{	_id: o_id 	},
		{ 	$inc:	{ clicks: 1 }	}, 
		function(err, result) {
			//console.log("Result: "+result);
		}
 	);

}


UsersMongo.prototype.update = function( query, set, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( set && typeof set === 'function' ){
		return set( 'No update data was provided' );
	}
	console.log(query);
	self.users.update( query, set, callback );
}

UsersMongo.prototype.findUsers = function( queryIn, callback ){
	var self = this, query = {}, options = {};
	
	if( queryIn.options ){
		options = queryIn.options;
		delete queryIn.options;
	}

	if( queryIn && typeof queryIn === 'function' ){
		callback = queryIn;
	}
	else{
		query = queryIn; 
	}

	if( !options.sort ){
		options.sort = {'title': 1};
	}
	if( !query.endDate ){
		query.endDate = {$gte:new Date()};
	}
	self.users.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

UsersMongo.prototype.findFeatured = function( queryIn, callback ){
	var self = this, query = {}, options = {};
	
	if( queryIn.options ){
		options = queryIn.options;
		delete queryIn.options;
	}

	if( queryIn && typeof queryIn === 'function' ){
		callback = queryIn;
	}
	else{
		query = queryIn; 
	}

	if( !options.sort ){
		options.sort = {'oid': 1};
	}

	self.featured.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

UsersMongo.prototype.findDistinctUsers = function( field, queryIn,  callback ){
	var self = this, query={};

	if( !field ){
		field = "title";
	}
	
	var options = queryIn.options;
	delete queryIn.options;
	
	query = queryIn;
	query.endDate = {$gte:new Date()};

	if( !options.sort ){
		options.sort = {'startDate': 1};
	}

	self.users.distinct( field, query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

UsersMongo.prototype.findOne = function ( query, callback ) {
	this.users.findOne( query, function (error, user) {
		callback(error, user);
	});
}


UsersMongo.prototype.findOneUser = function ( userID, callback ) {
	var o_id = new BSON.ObjectID(userID);

	this.users.findOne({ $query: { _id: o_id } }, function (error, user) {
		callback(error, user);
	});
}


UsersMongo.prototype.findFeaturedOne = function ( query, callback ) {
	this.featured.findOne( query, function (error, user) {
		callback(error, user);
	});
}


UsersMongo.prototype.count = function () {
	console.log("");

}

UsersMongo.prototype.getAll = function (callback) {
	
	//Gets all docs.
	this.users.find({ $query: {}, $orderby: { date_added : -1 } }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

UsersMongo.prototype.checkForNewUsers = function (userID, callback) {
	//console.log(userID);
	//userID = "381966172352049152";

	this.users.find({ $query: { approval_status: 1 }, $orderby: { id_str : -1 } }).toArray(function(err, docs) {
		var obj = [];
		for(var i = 0; i < docs.length; i++){
			if(docs[i].id_str == userID)
				break;
			obj[i] = docs[i];
		}	    
		callback(err, JSON.stringify(obj));
	});
	
}

UsersMongo.prototype.getAllEnabled = function (callback) {
	
	//Gets all docs.
	this.users.find({ $query: { enabled_status: 1 }, $orderby: { order : 1 } }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

UsersMongo.prototype.getAllWinners = function (callback) {
	
	//Gets all docs.
	this.users.find({ winner_status: { $gt: 0 } }).sort( { winner_status : -1 } ).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

UsersMongo.prototype.getRecent = function (callback) {
	
	//Gets recent 10 docs.
	this.users.find({ $query: {}, $orderby: { id_str : -1 } }).limit(10).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}


UsersMongo.prototype.getRecentApproved = function (callback) {
	
	//Gets recent 10 docs that are approved.
	this.users.find({ $query: { approval_status: 1 }, $orderby: { id_str : -1 } }).limit(10).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}



UsersMongo.prototype.getCount = function (callback) {

	//Gets doc count in collection.
	this.users.count(function(err, count) {
		//console.log("Collection count " + count);
		callback(err, count);
	});

}

UsersMongo.prototype.getMaxId = function (callback) {


	this.users.aggregate([
        {
		    $group : 
		    {
				_id  : "",
				last : 
				{
					$max : "$id_str"
				}
		    }
		}
      ], function(err, result) {
        //console.log("Ahh!!" + result.toString())
        callback(err, result);
    });


}

UsersMongo.prototype.updateUser = function (dbID, name, email, donation, callback) {
	
	console.log(donation);

	var o_id = new BSON.ObjectID(dbID);

	this.users.update(	{_id: o_id },
						{ 
 							$set:	{ 	name: name,
 										email: email,
 										donation: donation }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}

UsersMongo.prototype.updateOrder = function (dbID, statusVal, callback) {

	// console.log(dbID);
	// console.log(statusVal);
	
	var o_id = new BSON.ObjectID(dbID);

	this.users.update(	{_id: o_id },
						{ 
 							$set:	{ order: statusVal }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}