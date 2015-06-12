#Chromemote Front-End Site / Back-End API

## Overview
Built in early 2013. The fourth and final version of the website. Went from just HTML, to Drupal, to WordPress, to finally a custom node.js site.

### Implements
Node.js with Express, MongoDB, Dust.js, Stripe, Paypal, Amazon Payments, Cheerio, Email.js, jQuery

### Features
- Responsive front-end website with blog
- Custom CMS Admin Console
- Startup Stats Dashboard
- Chrome Web Store Extension stats scraper
- Custom Blog inline page editor
- Accepts donations with Stripe, Paypal, Amazon
- Paid user management
- Ad banner manager (remote set ad visible in app)
- Paid user activation API
- Email notifications

### Deployment
Azure.. because of MSDN free startup credits. :)
Deployed as cloud service originally to keep the app from sleeping when idle. 

- Create cloud service
- Create webrole
- Drop repo into webrole1
- Add creds and push.
- [GUIDE](https://azure.microsoft.com/en-us/documentation/articles/cloud-services-nodejs-develop-deploy-app/)
- If Publish Error: Set temp ENV_VARs to shorter path. ex. c:\tmp
