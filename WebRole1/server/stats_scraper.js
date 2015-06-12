"use strict";
var request = require('request')
   ,cheerio = require('cheerio')
   ;

var statsDB = null;

var Stats = function( mongo ) {
	var self = this;
	if( typeof mongo === 'undefined' ) { console.log( 'Stats( undefined )!'); }

	var StatsMongo = require("../libs/StatsMongo").StatsMongo;
	statsDB = new StatsMongo( {mongo:mongo} );	
};

exports.initStats = function( mongo ){
	return new Stats( mongo );
};

Stats.prototype.startScheduler = function(){
	var cronJob = require('cron').CronJob;
	
	var morningjob = new cronJob('00 00 17 * * 0-6', function(){
	    // Runs every day (Sunday through Saturday) at 11:30:00 AM.
	    scrapeStats();
	  }, function () {
	    // This function is executed when the job stops
	  },
	  true /* Start the job right now */
	);

	var eveningjob = new cronJob('00 00 05 * * 0-6', function(){
	    // Runs every day (Sunday through Saturday) at 11:30:00 AM.
	    scrapeStats();
	  }, function () {
	    // This function is executed when the job stops
	  },
	  true /* Start the job right now */
	);
};

Stats.prototype.getStats = function(){

};

Stats.prototype.scrapeStats = scrapeStats;

function scrapeStats(){
	
	var obj = [];
	var cswWeeklyUsers = 0,
	    cswCommentsCnt = 0;	

	var url = 'https://chrome.google.com/webstore/detail/chromemote-remote-for-goo/bhcjclaangpnjgfllaoodflclpdfcegb';
	request(url, function(err, resp, body) {
		if (err) throw err;
		var $ = cheerio.load(body);          

		$("span:contains(' users')").each(function() {
			cswWeeklyUsers = parseInt( $(this).text().replaceAll(" users","").replaceAll(",","") );
		});
		
		cswCommentsCnt = parseInt( $("span:contains(' users')").find("span").find("span").find("span").text().replaceAll("(","").replaceAll(")","") );

		obj.push( {"store": "CWS", "users":cswWeeklyUsers, "comments":cswCommentsCnt, "date": getTodaysDate() } );

		addNewCwsStat( obj );

		// console.log( obj );
	});

    return obj;
};

function getTodaysDate(){
    var dateNow  = new Date(),
    todaysMonth  = dateNow.getMonth()+1,
    todaysDay    = dateNow.getDate(),
    todaysYear   = dateNow.getFullYear(),
    todaysHour   = dateNow.getHours(),
    todaysMinute = dateNow.getMinutes();

    if(todaysMonth < 10) todaysMonth = "0"+todaysMonth;
    if(todaysDay < 10)   todaysDay   = "0"+todaysDay;
    if(todaysHour < 10)  todaysHour  = "0"+todaysHour;
    if(todaysMinute < 10)todaysMinute= "0"+todaysMinute;

    return todaysMonth + "/" + todaysDay + "/" + todaysYear + " " + todaysHour + ":" + todaysMinute;
};

function addNewCwsStat( statData ){	
	
    statsDB.insertAndReturn(statData, function(doc){    	
    	console.log("Inserted: ");
    	console.log(statData);
    });
};

String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};