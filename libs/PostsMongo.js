"use strict";
var BSON = require('bson').BSONPure;
var mongo = require('mongodb');
var ObjectID = mongo.ObjectID;
var fs = require('fs');
var readJson = (path, cb) => {
  fs.readFile(require.resolve(path), (err, data) => {
    if (err)
      cb(err)
    else
      cb(null, JSON.parse(data))
  })
}

/*
This object will take a db object.
It makes assumption that DB connection is established and authenticated.
*/
var PostsMongo = exports.PostsMongo = function(spec) {
	this.mongo = spec.mongo;
	this.posts = []; //this.mongo.getCollection('blog-posts');
}

var isEmpty = function (obj) {
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) return false;
	}
	return true;
}



/*
// Methods for posts
*/

PostsMongo.prototype.insert = function( post, callback ){
	this.posts.insert( post, {safe:true}, function( err ){
		callback( err )
	})
}


PostsMongo.prototype.insertAndReturn = function( post, callback ){
	
	
	
	
	var postsDB = this.posts;
	postsDB.insert( post, {safe:true}, function( err, doc ){
		if( err )callback( err );
		callback( doc );
	})
	

	
	
}


PostsMongo.prototype.remove = function( query, callback ){
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
	this.posts.remove( query, callback );
}



PostsMongo.prototype.findAndModifyPost = function( query, post, callback ){
	
	if( !query || typeof query === 'function' ){
		return callback( 'No query was provided' );
	}

	if( post && typeof post === 'function' ){
		return callback( 'No data was provided' );
	}
	
	// var o_id = new BSON.ObjectID(query.dbID);

	// this.posts.findAndModify( query, {	'_id':o_id
	// 									'name': query.name,
 // 										'email': query.email,
 // 										'donation': query.donations}, post, {safe:true, upsert:true, new:true}, callback );

	
}



PostsMongo.prototype.findAndIncrementPost = function( postID, callback ){
	var o_id = new BSON.ObjectID(postID);
	
	this.posts.findOne({ $query: { _id: o_id } }, function (error, post) {
		callback(error, post);
	});

	this.posts.update(	
		{	_id: o_id 	},
		{ 	$inc:	{ clicks: 1 }	}, 
		function(err, result) {
			//console.log("Result: "+result);
		}
 	);

}


PostsMongo.prototype.update = function( query, set, callback ){
	var self = this;
	
	if( query && typeof query === 'function' ){
		return query( 'No data was provided' );
	}

	if( set && typeof set === 'function' ){
		return set( 'No update data was provided' );
	}
	console.log(query);
	self.posts.update( query, set, callback );
}

PostsMongo.prototype.findPosts = function( queryIn, callback ){
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
	self.posts.find( query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

PostsMongo.prototype.findFeatured = function( queryIn, callback ){
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

PostsMongo.prototype.findDistinctPosts = function( field, queryIn,  callback ){
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

	self.posts.distinct( field, query, options, function( err, cursor ){
		
		if( err ) return callback( err );

		cursor.toArray( function( err, docs ){

			if( err ) return callback( err );

			return callback( err, docs );

		})
	});
}

PostsMongo.prototype.findOne = function ( query, callback ) {
	this.posts.findOne( query, function (error, post) {
		callback(error, post);
	});
}


PostsMongo.prototype.findOnePost = function ( postID, callback ) {
	var o_id = new BSON.ObjectID(postID);

	this.posts.findOne({ $query: { _id: o_id } }, function (error, post) {
		callback(error, post);
	});
}


PostsMongo.prototype.findOnePostByPath = function ( path, callback ) {

	readJson('../collections/blog-posts.json', (err, docs) => {
		var posts = [];
		if (docs.posts) posts = docs.posts;
		posts = posts.filter(function(a){return (a && a.path === path)});
		posts = posts.sort(function(a,b){return (new Date(b.date) - new Date(a.date))});
    callback(err, {...posts[0]});
  });

}


PostsMongo.prototype.findFeaturedOne = function ( query, callback ) {
	this.featured.findOne( query, function (error, post) {
		callback(error, post);
	});
}


PostsMongo.prototype.count = function () {
	console.log("");

}

PostsMongo.prototype.getAll = function (callback) {
	
	//Gets all docs.
	// this.posts.find({ $query: {} }).sort({ _id: -1 }).toArray(function(err, docs) {
	// 	//console.log("All docs: " + docs);
	// 	callback(err, docs);
	// });

	readJson('./collections/blog-posts.json', (err, docs) => {
		console.log('docs!!');
		console.log(docs);
    callback(err, docs);
  });

}

PostsMongo.prototype.getLivePosts = function (callback) {

	// this.posts.find({ $query: { live: true } }).sort({ date: -1 }).toArray(function(err, docs) {
	// 	callback(err, docs);
	// });

	readJson('../collections/blog-posts.json', (err, docs) => {
		var posts = [];
		if (docs.posts) posts = docs.posts;
		posts = posts.filter(function(a){return (a && a.live)});
		posts = posts.sort(function(a,b){return (new Date(b.date) - new Date(a.date))});
    callback(err, posts);
  });
	
}

PostsMongo.prototype.checkForNewPosts = function (postID, callback) {
	//console.log(postID);
	//postID = "381966172352049152";

	// this.posts.find({ $query: { approval_status: 1 } }).sort({ id_str: -1 }).toArray(function(err, docs) {
	// 	var obj = [];
	// 	for(var i = 0; i < docs.length; i++){
	// 		if(docs[i].id_str == postID)
	// 			break;
	// 		obj[i] = docs[i];
	// 	}	    
	// 	callback(err, JSON.stringify(obj));
	// });

	readJson('../collections/blog-posts.json', (err, docs) => {
		var posts = [];
		if (docs.posts) posts = docs.posts;
		posts = posts.filter(function(a){return (a && a.enabled_status)});
		posts = posts.sort(function(a,b){return (new Date(b.date) - new Date(a.date))});
    callback(err, posts);
  });
	
}

PostsMongo.prototype.getAllEnabled = function (callback) {
	
	//Gets all docs.
	// this.posts.find({ $query: { enabled_status: 1 } }).sort({ order: 1 }).toArray(function(err, docs) {
	// 	//console.log("All docs: " + docs);
	// 	callback(err, docs);
	// });

	readJson('../collections/blog-posts.json', (err, docs) => {
		var posts = [];
		if (docs.posts) posts = docs.posts;
		posts = posts.filter(function(a){return (a && a.enabled_status)});
		posts = posts.sort(function(a,b){return (new Date(b.date) - new Date(a.date))});
    callback(err, posts);
  });

}

PostsMongo.prototype.getAllWinners = function (callback) {
	
	//Gets all docs.
	this.posts.find({ winner_status: { $gt: 0 } }).sort({ winner_status : -1} ).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}

PostsMongo.prototype.getRecent = function (callback) {
	
	//Gets recent 10 docs.
	this.posts.find({ $query: {} }).limit(10).sort({ id_str: -1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}


PostsMongo.prototype.getRecentApproved = function (callback) {
	
	//Gets recent 10 docs that are approved.
	this.posts.find({ $query: { approval_status: 1 } }).limit(10).sort({ id_str: -1 }).toArray(function(err, docs) {
		//console.log("All docs: " + docs);
		callback(err, docs);
	});

}



PostsMongo.prototype.getCount = function (callback) {

	//Gets doc count in collection.
	this.posts.count(function(err, count) {
		//console.log("Collection count " + count);
		callback(err, count);
	});

}

PostsMongo.prototype.getMaxId = function (callback) {


	this.posts.aggregate([
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

PostsMongo.prototype.updatePost = function (postData, callback) {
	
	console.log(postData);

	var o_id = new BSON.ObjectID(postData.id);

	this.posts.update(	{_id: o_id },
	{ 
		$set:{  title: postData.title,
				date: postData.date,
				body: postData.body,
				path: postData.path,
				live: postData.live 
			 }
		}, 
		function(err, result) {
			callback(err, postData);
		}
  	);

}

PostsMongo.prototype.updateOrder = function (dbID, statusVal, callback) {

	// console.log(dbID);
	// console.log(statusVal);
	
	var o_id = new BSON.ObjectID(dbID);

	this.posts.update(	{_id: o_id },
						{ 
 							$set:	{ order: statusVal }
 						}, 
 						function(err, result) {
 						//	console.log("Result: "+result);
 						}
 				  	);

}


PostsMongo.prototype.setPublishedStatus = function (dbID, publishedVal, callback) {

	// console.log(dbID);
	// console.log(publishedVal);
	
	var o_id = new BSON.ObjectID(dbID);

	var postsDB = this.posts;
	postsDB.update(	
		{_id: o_id },
		{ 
			$set:	{ live: publishedVal }
		}, 
		function(err, result) {
		//	console.log("Result: "+result);
		}
  	);

}