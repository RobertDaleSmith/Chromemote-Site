"use strict";

var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

/*
This object will take a db object.
It makes assumption that DB connection is established and authenticated.
*/
var AdsMongo = exports.AdsMongo = function(spec) {
	this.mongo = spec.mongo;
	this.ads = [];//this.mongo.getCollection('sponsor-ads');
}

var isEmpty = function (obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) return false;
	}
	return true;
}



/*
// Methods for ads
*/

AdsMongo.prototype.insert = function( ad, callback ){
	this.ads.insert( ad, {safe:true}, function( err ){
		callback( err )
	})
}


AdsMongo.prototype.insertAndReturn = function( ad, callback ){
	this.ads.insert( ad, {safe:true}, function( err, doc ){
		if( err )callback( err );
		callback( doc );
	})
}


AdsMongo.prototype.remove = function( query, callback ){
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
	self.ads.remove( query, callback );
}


AdsMongo.prototype.findAndModifyAd = function( query, ad, callback ){
	
	if( !query || typeof query === 'function' ){
		return callback( 'No query was provided' );
	}

	if( ad && typeof ad === 'function' ){
		return callback( 'No data was provided' );
	}
	

	this.ads.findAndModify( query, {'_id':1}, ad, {safe:true, upsert:true, new:true}, callback );
}



AdsMongo.prototype.findAndIncrementAd = function( adID, callback ){
	var o_id = new BSON.ObjectID(adID);
	
	this.ads.findOne({ $query: { _id: o_id } }, function (error, ad) {
		callback(error, ad);
	});

	this.ads.update(	
		{	_id: o_id 	},
		{ 	$inc:	{ clicks: 1 }	}, 
		function(err, result) {
			//console.log("Result: "+result);
		}
 	);

}


AdsMongo.prototype.update = function( query, set, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( set && typeof set === 'function' ){
		return set( 'No update data was provided' );
	}
	console.log(query);
	self.ads.update( query, set, callback );
}

AdsMongo.prototype.findAds = function( queryIn, callback ){
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
	self.ads.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

AdsMongo.prototype.findFeatured = function( queryIn, callback ){
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

AdsMongo.prototype.findDistinctAds = function( field, queryIn,  callback ){
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

	self.ads.distinct( field, query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

AdsMongo.prototype.findOne = function ( query, callback ) {
	this.ads.findOne( query, function (error, ad) {
		callback(error, ad);
	});
}


AdsMongo.prototype.findOneAd = function ( adID, callback ) {
	var o_id = new BSON.ObjectID(adID);

	this.ads.findOne({ $query: { _id: o_id } }, function (error, ad) {
		callback(error, ad);
	});
}


AdsMongo.prototype.findFeaturedOne = function ( query, callback ) {
	this.featured.findOne( query, function (error, ad) {
		callback(error, ad);
	});
}


AdsMongo.prototype.count = function () {
	console.log("");

}

AdsMongo.prototype.getAll = function (callback) {
	
	//Gets all docs.
	this.ads.find({ $query: {} }).sort({ order: 1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

AdsMongo.prototype.checkForNewAds = function (adID, callback) {
	//console.log(adID);
	//adID = "381966172352049152";

	this.ads.find({ $query: { approval_status: 1 } }).sort({ id_str: -1 }).toArray(function(err, docs) {
		var obj = [];
		for(var i = 0; i < docs.length; i++){
			if(docs[i].id_str == adID)
				break;
			obj[i] = docs[i];
		}	    
		callback(err, JSON.stringify(obj));
	});
	
}

AdsMongo.prototype.getAllEnabled = function (callback) {
	
	//Gets all docs.
	this.ads.find({ $query: { enabled_status: 1 } }).sort({ order: 1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

AdsMongo.prototype.getAllWinners = function (callback) {
	
	//Gets all docs.
	this.ads.find({ winner_status: { $gt: 0 } }).sort( { winner_status : -1 } ).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

AdsMongo.prototype.getRecent = function (callback) {
	
	//Gets recent 10 docs.
	this.ads.find({ $query: {} }).limit(10).sort({ id_str: -1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}


AdsMongo.prototype.getRecentApproved = function (callback) {
	
	//Gets recent 10 docs that are approved.
	this.ads.find({ $query: { approval_status: 1 } }).limit(10).sort({ id_str: -1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}



AdsMongo.prototype.getCount = function (callback) {

	//Gets doc count in collection.
	this.ads.count(function(err, count) {
		//console.log("Collection count " + count);
		callback(err, count);
	});

}

AdsMongo.prototype.getMaxId = function (callback) {


	this.ads.aggregate([
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


AdsMongo.prototype.setEnabledStatus = function (dbID, statusVal, callback) {

	// console.log(dbID);
	// console.log(statusVal);

	var o_id = new BSON.ObjectID(dbID);

	this.ads.update(	{_id: o_id },
						{ 
 							$set:	{ enabled_status: statusVal }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}

AdsMongo.prototype.updateOrder = function (dbID, statusVal, callback) {

	// console.log(dbID);
	// console.log(statusVal);
	
	var o_id = new BSON.ObjectID(dbID);

	this.ads.update(	{_id: o_id },
						{ 
 							$set:	{ order: statusVal }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}