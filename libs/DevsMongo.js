"use strict";
var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

/*
This object will take a db object.
It makes assumption that DB connection is established and authenticated.
*/
var DevsMongo = exports.DevsMongo = function(spec) {
	this.mongo = spec.mongo;
	this.devs = this.mongo.getCollection('dev-signup');
}

var isEmpty = function (obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) return false;
	}
	return true;
}



/*
// Methods for devs
*/

DevsMongo.prototype.insert = function( dev, callback ){
	this.devs.insert( dev, {safe:true}, function( err ){
		callback( err )
	})
}


DevsMongo.prototype.insertAndReturn = function( dev, callback ){
	
	console.log(dev.email);
	this.devs.findOne({ $query: { email: dev.email } }, function (error, userDoc) {
		if(!userDoc){
			console.log("Error: " + error);
			insert(dev, callback);
		} else {
			
			
		}
	});

	var devsDB = this.devs;
	dev.date = new Date();		
	console.log(new Date());
	function insert(dev, callback){
		console.log(dev.email);
		dev.email = dev.email.toLowerCase();
		devsDB.insert( dev, {safe:true}, function( err, doc ){
			if( err )callback( err );
			callback( doc );
		})
	}
	
}


DevsMongo.prototype.remove = function( query, callback ){
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
	this.devs.remove( query, callback );
}



DevsMongo.prototype.findAndModifyUser = function( query, dev, callback ){
	
	if( !query || typeof query === 'function' ){
		return callback( 'No query was provided' );
	}

	if( dev && typeof dev === 'function' ){
		return callback( 'No data was provided' );
	}
	
	// var o_id = new BSON.ObjectID(query.dbID);

	// this.devs.findAndModify( query, {	'_id':o_id
	// 									'name': query.name,
 // 										'email': query.email,
 // 										'donation': query.donations}, dev, {safe:true, upsert:true, new:true}, callback );

	
}



DevsMongo.prototype.findAndIncrementUser = function( userID, callback ){
	var o_id = new BSON.ObjectID(userID);
	
	this.devs.findOne({ $query: { _id: o_id } }, function (error, dev) {
		callback(error, dev);
	});

	this.devs.update(	
		{	_id: o_id 	},
		{ 	$inc:	{ clicks: 1 }	}, 
		function(err, result) {
			//console.log("Result: "+result);
		}
 	);

}


DevsMongo.prototype.update = function( query, set, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( set && typeof set === 'function' ){
		return set( 'No update data was provided' );
	}
	console.log(query);
	self.devs.update( query, set, callback );
}

DevsMongo.prototype.findDevs = function( queryIn, callback ){
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
	self.devs.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

DevsMongo.prototype.findFeatured = function( queryIn, callback ){
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

DevsMongo.prototype.findDistinctDevs = function( field, queryIn,  callback ){
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

	self.devs.distinct( field, query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

DevsMongo.prototype.findOne = function ( query, callback ) {
	this.devs.findOne( query, function (error, dev) {
		callback(error, dev);
	});
}


DevsMongo.prototype.findOneUser = function ( userID, callback ) {
	var o_id = new BSON.ObjectID(userID);

	this.devs.findOne({ $query: { _id: o_id } }, function (error, dev) {
		callback(error, dev);
	});
}


DevsMongo.prototype.findFeaturedOne = function ( query, callback ) {
	this.featured.findOne( query, function (error, dev) {
		callback(error, dev);
	});
}


DevsMongo.prototype.count = function () {
	console.log("");

}

DevsMongo.prototype.getAll = function (callback) {
	
	//Gets all docs.
	this.devs.find({ $query: {}, $orderby: { date_added : -1 } }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

DevsMongo.prototype.checkForNewDevs = function (userID, callback) {
	//console.log(userID);
	//userID = "381966172352049152";

	this.devs.find({ $query: { approval_status: 1 }, $orderby: { id_str : -1 } }).toArray(function(err, docs) {
		var obj = [];
		for(var i = 0; i < docs.length; i++){
			if(docs[i].id_str == userID)
				break;
			obj[i] = docs[i];
		}	    
		callback(err, JSON.stringify(obj));
	});
	
}

DevsMongo.prototype.getAllEnabled = function (callback) {
	
	//Gets all docs.
	this.devs.find({ $query: { enabled_status: 1 }, $orderby: { order : 1 } }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

DevsMongo.prototype.getAllWinners = function (callback) {
	
	//Gets all docs.
	this.devs.find({ winner_status: { $gt: 0 } }).sort( { winner_status : -1 } ).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

DevsMongo.prototype.getRecent = function (callback) {
	
	//Gets recent 10 docs.
	this.devs.find({ $query: {}, $orderby: { id_str : -1 } }).limit(10).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}


DevsMongo.prototype.getRecentApproved = function (callback) {
	
	//Gets recent 10 docs that are approved.
	this.devs.find({ $query: { approval_status: 1 }, $orderby: { id_str : -1 } }).limit(10).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}



DevsMongo.prototype.getCount = function (callback) {

	//Gets doc count in collection.
	this.devs.count(function(err, count) {
		//console.log("Collection count " + count);
		callback(err, count);
	});

}

DevsMongo.prototype.getMaxId = function (callback) {


	this.devs.aggregate([
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

DevsMongo.prototype.updateUser = function (dbID, name, email, donation, callback) {
	
	console.log(donation);

	var o_id = new BSON.ObjectID(dbID);

	this.devs.update(	{_id: o_id },
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

DevsMongo.prototype.updateOrder = function (dbID, statusVal, callback) {

	// console.log(dbID);
	// console.log(statusVal);
	
	var o_id = new BSON.ObjectID(dbID);

	this.devs.update(	{_id: o_id },
						{ 
 							$set:	{ order: statusVal }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}