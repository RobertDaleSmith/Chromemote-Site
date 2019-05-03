"use strict";
var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;

/*
This object will take a db object.
It makes assumption that DB connection is established and authenticated.
*/
var StatsMongo = exports.StatsMongo = function(spec) {
	this.mongo = spec.mongo;
	this.stats = this.mongo.getCollection('store-stats');
}


/*
// Methods for stats
*/

StatsMongo.prototype.insert = function( stat, callback ){
	this.stats.insert( stat, {safe:true}, function( err ){
		callback( err )
	})
}


StatsMongo.prototype.insertAndReturn = function( stat, callback ){
	console.log(stat);
	this.stats.insert( stat, {safe:true}, function( err, doc ){
		if( err )callback( err );
		callback( doc );
	})
}

StatsMongo.prototype.remove = function( query, callback ){
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
	self.stats.remove( query, callback );
}

StatsMongo.prototype.findAndModifyStat = function( query, stat, callback ){
	
	if( !query || typeof query === 'function' ){
		return callback( 'No query was provided' );
	}

	if( stat && typeof stat === 'function' ){
		return callback( 'No data was provided' );
	}
	

	this.stats.findAndModify( query, {'_id':1}, stat, {safe:true, upsert:true, new:true}, callback );
}

StatsMongo.prototype.update = function( query, set, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( set && typeof set === 'function' ){
		return set( 'No update data was provided' );
	}
	console.log(query);
	self.stats.update( query, set, callback );
}

StatsMongo.prototype.findStats = function( queryIn, callback ){
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
	self.stats.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

StatsMongo.prototype.findOne = function ( query, callback ) {
	this.stats.findOne( query, function (error, stat) {
		callback(error, stat);
	});
}

StatsMongo.prototype.findOneStat = function ( statID, callback ) {
	var o_id = new BSON.ObjectID(statID);

	this.stats.findOne({ $query: { _id: o_id } }, function (error, stat) {
		callback(error, stat);
	});
}

StatsMongo.prototype.getAll = function (callback) {
	
	//Gets all docs.
	this.stats.find({ $query: {} }).sort({ date: -1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

StatsMongo.prototype.getCount = function (callback) {

	//Gets doc count in collection.
	this.stats.count(function(err, count) {
		//console.log("Collection count " + count);
		callback(err, count);
	});

}