var express = require('express')
  , sm = require('sitemap')
  , http = require('http')
  , cons = require('consolidate')
  , cors = require('cors')
  , MongoStore = require( 'connect-mongodb' )
  , config = require('config');

var session = require('express-session');
var app = express();

var dbConfig = config.get('dbConfig');
var dbInfo = {
  name: process.env.DB_NAME || dbConfig.name,
  url: process.env.DB_PATH || dbConfig.url,
  port: process.env.DB_PORT || dbConfig.port,
  username: process.env.DB_USER || dbConfig.username,
  password: process.env.DB_PASS || dbConfig.password,
  secret: process.env.SECRET || dbConfig.secret,
  cookieStr: dbConfig.cookieStr,
  collections: dbConfig.collections,
};

var mongo = new (require('./libs/Mongo').Mongo)(dbInfo);

//Custom Dust.JS helpers
var dust = require('dustjs-linkedin');
dust.helper = require('dustjs-helpers');
  
if (!dust.helpers) dust.helpers = {};

dust.helpers.formatIndex = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  text = text.split(';'),
  idx  = text[0],
  len  = text[1];

  var reversed = (idx - len) * -1;

  return chunk.write(reversed);
}

dust.helpers.getMonth = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  // console.log(text);
  var res = parseInt(text.substring(5,7));
  switch(res) {
    case 1:  res = "Jan"; break; case 2:  res = "Feb"; break; case 3:  res = "Mar"; break;
    case 4:  res = "Apr"; break; case 5:  res = "May"; break; case 6:  res = "Jun"; break;
    case 7:  res = "Jul"; break; case 8:  res = "Aug"; break; case 9:  res = "Sept";break;
    case 10: res = "Oct"; break; case 11: res = "Nov"; break; case 12: res = "Dec"; break;
  }
  return chunk.write(res);
}

dust.helpers.getYear = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = parseInt(text.substring(0,4));
  return chunk.write(res);
}

dust.helpers.getDay = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = parseInt(text.substring(8,10));
  return chunk.write(res);
}

dust.helpers.getDate = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = text.substring(0,10);
  return chunk.write(res);
}

dust.helpers.getTime = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = text.substring(11,text.length);
  return chunk.write(res);
}

dust.helpers.makeShorter = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var limit = 100;
  var res = text.substring(0,limit);
  if(text.length > limit) res = res+"...";
  return chunk.write(res);
}

mongo.connect(function(err) {

  if(err) console.log(err)
  // assign dust engine to .dust files
  app.engine('dust', cons.dust);

  app.configure(function(){
    app.set('view engine', 'dust');
    app.set('views', __dirname + '/views');
    app.set('view options', { pretty: true });
    app.use(express.favicon(__dirname + '/public/images/favicon.ico')); 
    app.use(express.logger('dev'));
    app.use(express.compress());
    app.use(express.static(__dirname + '/public', {redirect: false}));
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/tmp" }));
    app.use(express.methodOverride());
    app.use(express.cookieParser(dbInfo.cookieStr));
    app.use(session({
        secret: dbInfo.secret,
        // store: new MongoStore({
        //     db: mongo.getDB(),
        //     username: dbInfo.username,
        //     password: dbInfo.password,
        //     collection: 'admin-sessions'
        // }),
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 24*60*60*1000 }
    }));
    app.use(app.router);
  });

  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  var routes = {};

  var Main = require('./routes/main.js').initMain;
  routes.Main = new Main(mongo) ;

  var Admin = require('./routes/admin.js').initAdmin;
  routes.Admin = new Admin(mongo);

  var Stats = require('./server/stats_scraper.js').initStats;
  statsScraper = new Stats(mongo);
  statsScraper.startScheduler();

  /* Middlewares */
  function requiresLogin(req, res, next) {
    if( req.session.admin && req.session.loggedIn ){
        next();
    }
    else{
      res.redirect('/admin/login?returnurl=' + req.url);
    }
  };

  function requiresLoginAjax(req, res, next) {
    if( req.session.admin && req.session.loggedIn ){
      next();
    }
    else {
      res.status(403);
      res.send({success:false, error:'Not logged in'});
    }
  };
  
  // /* Dynamic helpers */
  app.all('/admin/*', function( req, res, next ) {
    if( req.session.admin ){
      res.locals.admin = req.session.admin;
      res.locals.loggedIn = true;
      console.log('loggedIn');
    }
    next();
  });

  app.all(/.*/, function(req, res, next) {
    var host = req.header("host");
    
    if (host.match(/^api\..*/i)) {
      res.redirect(301, "http://" + host.replace('api.','') + req.originalUrl);
    } else {
      next();
    }
  });

  app.get( '/', function( req, res, next ) { routes.Main.home( req, res, next ); } );
  app.get( '/faq', function( req, res, next ) { routes.Main.faq( req, res, next ); } );
  app.get( '/support-us', function( req, res, next ) { routes.Main.contribute( req, res, next ); } );
  app.get( '/tipjar', function( req, res, next ) { routes.Main.tipjar( req, res, next ); } );
  app.get( '/donate', function( req, res, next ) { routes.Main.tipjar( req, res, next ); } );
  app.get( '/support-us/thank-you', function( req, res, next ) { routes.Main.thankYou( req, res, next ); } );
  app.get( '/update', function( req, res, next ) { routes.Main.update( req, res, next ); } );
  app.get( '/in-the-media', function( req, res, next ) { routes.Main.inTheMedia( req, res, next ); } );
  app.get( '/press', function( req, res, next ) { routes.Main.press( req, res, next ); } );

  app.post( '/support-us/ipn', function( req, res, next ) { routes.Main.payPalIPN( req, res, next ); } );
  app.post( '/support-us/iopn', function( req, res, next ) { routes.Main.amazonIOPN( req, res, next ); } );
  app.post( '/support-us/stripe', function( req, res, next ) { routes.Main.stripePayment( req, res, next ); } );
  app.post( '/support-us/dev-signup', function( req, res, next ) { routes.Main.devSignup( req, res, next ); } );
  app.post( '/support-us/comment', function( req, res, next ) { routes.Main.supportComment( req, res, next ); } );

  app.get( '/blog', function( req, res, next ) { routes.Main.blogHome( req, res, next ); } );
  app.get( '/blog/:path', function( req, res, next ) { routes.Main.blogPost( req, res, next ); } );
  app.get( '/2013/:path', function( req, res, next ) { routes.Main.blogRedirect( req, res, next ); } );
  app.get( '/2012/:path', function( req, res, next ) { routes.Main.blogRedirect( req, res, next ); } );

  app.get( '/get-key', function( req, res, next ) { routes.Main.getKey( req, res, next ); } );
  app.post('/get-key/activate', cors(), function( req, res, next ) { routes.Main.checkKey( req, res, next ); } );
  app.post('/getKey/keyGen', function( req, res, next ) { routes.Main.emailKey( req, res, next ); } );
  app.get( '/ads', cors(), function( req, res, next ) { routes.Main.getAds( req, res, next ); } );
  app.get( '/ads/list.json', cors(), function( req, res, next ) { routes.Main.getAds( req, res, next ); } );

  app.get( '/link/:linkId', function( req, res, next ) { routes.Main.redirectLink( req, res, next ); } ); 

  app.get( '/admin', function( req, res, next ) { routes.Admin.admin( req, res, next ); } );
  app.get( '/admin/logout', function( req, res, next ) { routes.Admin.logOut( req, res, next ); } );
  app.get( '/admin/login', function( req, res, next ) { routes.Admin.login( req, res, next ); } );
  app.post('/admin/login', function( req, res, next ) { routes.Admin.postLogin( req, res, next ); });  
  
  app.get( '/admin/dashboard', requiresLogin, function( req, res, next ) { routes.Admin.dashboard( req, res, next ); } );  
  app.get( '/admin/ads', requiresLogin, function( req, res, next ) { routes.Admin.ads( req, res, next ); } ); 
  app.get( '/admin/users', requiresLogin, function( req, res, next ) { routes.Admin.users( req, res, next ); } ); 
  app.get( '/admin/blog', requiresLogin, function( req, res, next ) { routes.Admin.posts( req, res, next ); } ); 
  app.get( '/admin/blog/new', requiresLogin, function( req, res, next ) { routes.Admin.newPost( req, res, next ); } ); 

  app.get( '/admin/createPwd/:pwd', requiresLogin, function( req, res, next ) { routes.Admin.createPwd( req, res, next ); } ); 
  app.get( '/admin/keyGen/:email', requiresLogin, function( req, res, next ) { routes.Admin.keyGen( req, res, next ); } ); 

  app.get( '/admin/js/:scriptFileName', requiresLoginAjax, function( req, res, next ) { routes.Admin.privateScript( req, res, next ); } ); 
  app.get( '/admin/css/:styleFileName' , requiresLoginAjax, function( req, res, next ) { routes.Admin.privateStyle( req, res, next );  } ); 
  app.get( '/admin/images/:imageFileName' , requiresLoginAjax, function( req, res, next ) { routes.Admin.privateImage( req, res, next );  } ); 

  app.post( '/admin/users/new', requiresLogin, function( req, res, next ) { routes.Admin.addNewUser( req, res, next ); } );
  app.post( '/admin/users/remove', requiresLogin, function( req, res, next ) { routes.Admin.removeUser( req, res, next ); } );  
  app.post( '/admin/users/updateUser', requiresLogin, function( req, res, next ) { routes.Admin.updateUser( req, res, next ); } ); 
  app.post( '/admin/users/getUserItemHTML', requiresLogin, function( req, res, next ) { routes.Admin.getUserItemHTML( req, res, next ); } ); 

  app.post( '/admin/ads/enabler', requiresLogin, function( req, res, next ) { routes.Admin.enabledAd( req, res, next ); } ); 
  app.post( '/admin/ads/new', requiresLogin, function( req, res, next ) { routes.Admin.addNewAd( req, res, next ); } ); 
  app.post( '/admin/ads/remove', requiresLogin, function( req, res, next ) { routes.Admin.removeAd( req, res, next ); } ); 
  app.post( '/admin/ads/updateOrder', requiresLogin, function( req, res, next ) { routes.Admin.updateOrder( req, res, next ); } ); 
  app.post( '/admin/ads/getAdItemHTML', requiresLogin, function( req, res, next ) { routes.Admin.getAdItemHTML( req, res, next ); } ); 

  app.get( '/admin/dashboard/get_stats', function( req, res, next ) { routes.Admin.getStats( req, res, next ); } ); 
  app.post( '/admin/dashboard/get_stats', requiresLogin, function( req, res, next ) { routes.Admin.getStats( req, res, next ); } ); 
  app.post( '/admin/dashboard/pull_cws', requiresLogin, function( req, res, next ) { routes.Admin.pullCWS( req, res, next ); } ); 

  app.post( '/admin/blog/new', requiresLogin, function( req, res, next ) { routes.Admin.addNewPost( req, res, next ); } ); 
  app.get(  '/admin/blog/:pathString', requiresLogin, function( req, res, next ) { routes.Admin.editPostFromPath( req, res, next ); } ); 
  app.get(  '/admin/blog/id/:postId', requiresLogin, function( req, res, next ) { routes.Admin.editPostFromId( req, res, next ); } ); 
  app.post( '/admin/blog/update', requiresLogin, function( req, res, next ) { routes.Admin.updatePost( req, res, next ); } ); 
  app.post( '/admin/blog/remove', requiresLogin, function( req, res, next ) { routes.Admin.removePost( req, res, next ); } ); 
  app.post( '/admin/blog/publish', requiresLogin, function( req, res, next ) { routes.Admin.publishPost( req, res, next ); } ); 

  var sitemapUrls = [
    { url: '/',  changefreq: 'monthly', priority: 1.0 },
    { url: '/blog/',  changefreq: 'daily',  priority: 0.9 },
    { url: '/faq/',  changefreq: 'monthly',  priority: 0.8 },
    { url: '/support-us/',  changefreq: 'monthly',  priority: 0.7 },
    { url: '/support-us/thank-you/',  changefreq: 'monthly',  priority: 0.6 },
    { url: '/press/',  changefreq: 'monthly',  priority: 0.5 },
    { url: '/update/',  changefreq: 'monthly',  priority: 0.4 }
  ];
  var sitemap = sm.createSitemap ({
    hostname: 'http://chromemote.com',
    cacheTime: 600000,        // 600 sec - cache purge period
    urls: sitemapUrls
  });

  app.get('/sitemap.xml', function(req, res) {
    sitemap.toXML( function (xml) {
      res.header('Content-Type', 'application/xml');
      res.send( xml );
    });
  });

  app.set('port', process.env.PORT || 8080);
  http.createServer(app).listen(app.get('port'), function(){
	 console.log('Express server listening on port ' + app.get('port'));
  });

});

module.exports = app;