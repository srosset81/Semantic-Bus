"use strict";
//memory leak tool, code is here to don't forget
// var memwatch = require('memwatch-next');
// var hd = new memwatch.HeapDiff();
// var diff = hd.end();

var express = require('express')
var cors = require('cors')
var app = express();
app.use(cors());
var jenkins = process.env.JENKINS_DEPLOY || false;

var passport = require('passport');

var http = require('http');
http.globalAgent.maxSockets = 1000000000;
var server = http.Server(app);
var amqp = require('amqplib/callback_api');


var safe = express.Router();
var unSafeRouteur = express.Router();

var bodyParser = require("body-parser");
app.use(bodyParser.json({
  limit: '10mb'
}));
app.use(bodyParser.urlencoded({
  limit: '10mb',
  extended: true
}));
safe.use(bodyParser.json()); // used to parse JSON object given in the request body
var env = process.env;



var httpGet = require('./webServices/workSpaceComponentDirectory/restGetJson.js');
var fs = require('fs');
const configUrl = env.CONFIG_URL || 'http://data-players.com/config/devOutOfDocker.json';
httpGet.makeRequest('GET', {
  url: configUrl
}).then(result => {
  console.log('~~ remote config | ');
  const configJson = result.data;
  const content = 'module.exports = ' + JSON.stringify(result.data);



  fs.writeFile("configuration.js", content, 'utf8', function(err) {
    if (err) {
      throw err;
    } else {

      console.log("~~ remote configuration saved");
      require('./lib/core/Oauth/google_auth_strategy')(passport);

      var jwtService = require('./webServices/jwtService')


      //Sécurisation des route de data
      safe.use(function(req, res, next) {
        // ensureSec(req,res,next)
        jwtService.securityAPI(req, res, next);
      })

      app.disable('etag'); //what is that? cache desactivation in HTTP Header

      unSafeRouteur.use(cors());


      let url;
      console.log("PROCESS ENV", process.env.NODE_ENV)
      if(process.env.NODE_ENV === "development_docker"){
        url = "amqp://rabbitmq:5672";
      }else {
        url = configJson.socketServer
      }
      
      amqp.connect(url + '/' + configJson.amqpHost, function(err, conn) {
        //if(err!=undefined){
        console.log('AMQP Connection Error', err);
        //}
        console.log('AMQP connected', conn);
        conn.createChannel(function(err, ch) {
          console.log('AMQP connected 2');
          onConnect(ch);
          console.log('channel created');
          ch.assertQueue('work-ask', {
            durable: true
          });
          onError(err)
          // ch.assertExchange('amq-topic', 'topic', {
          //   durable: true
          // });
        });

      });
      var onConnect = function(amqpClient) {
        //  console.log(app);
        console.log('connected');
        //stompClient.subscribe('/queue/work-ask', message=>{console.log('ALLO');});
        let messagingSevices = [];


        //TODO it's ugly!!!! sytem function is increment with stompClient
        require('./webServices/initialise')(unSafeRouteur, amqpClient);
        require('./webServices/authWebService')(unSafeRouteur, amqpClient);
        require('./webServices/workspaceWebService')(safe, amqpClient);
        require('./webServices/workspaceComponentWebService')(safe, amqpClient);
        require('./webServices/technicalComponentWebService')(safe, unSafeRouteur, app, amqpClient);
        require('./webServices/userWebservices')(safe, amqpClient);
        require('./webServices/rightsManagementWebService')(safe, amqpClient);
        require('./webServices/adminWebService')(safe, amqpClient);
        require('./webServices/fragmentWebService')(safe, amqpClient);

        ///OTHER APP COMPONENT
        ///SECURISATION DES REQUETES
        app.get('/', function(req, res, next) {
          res.redirect('/ihm/application.html#myWorkspaces');
        });
        app.use('/auth', express.static('static'));
        app.use('/auth', unSafeRouteur);
        app.use('/configuration', unSafeRouteur);
        app.use('/data/specific', unSafeRouteur);
        app.use('/data/api', unSafeRouteur);
        app.use('/data/core', safe);
        app.use('/ihm', express.static('static', {
          etag: false
        }));
        app.use('/browserify', express.static('browserify'));
        app.use('/npm', express.static('node_modules'));

        let errorLib = require('./lib/core/lib/error_lib');
        let jwtSimple = require('jwt-simple');
        let errorParser = require('error-stack-parser');
        app.use(function(err, req, res, next) {
          //console.log('PROXY');
          if (err) {
            //console.log('ERROR MANAGEMENT');
            var token = req.body.token || req.query.token || req.headers['authorization'];
            //console.log('token |',token);
            let user;
            if (token != undefined) {
              token.split("");
              let decodedToken = jwtSimple.decode(token.substring(4, token.length), configJson.secret);
              user = decodedToken.iss;
              //console.log('user |',user);
            }
            errorLib.create(err, user);
            //console.log(err);
            //console.log('XXXXXXXXXXX',res);
            if (!Array.isArray(err)) {
              err = [err];
            }
            res.status(500).send(
              err.map(e => {
                console.log(e);
                return {
                  message: e.message,
                  stack: errorParser.parse(e),
                  displayMessage: e.displayMessage
                }
              })
            );
          }
          //able to centralise response using res.data ans res.send(res.data)
        });

        app.listen(80, function(err) {
          console.log('~~ server started at ', err, ':', this.address())
          //console.log('ALLO');
          require('./lib/core/timerScheduler').run();

          if (jenkins) {
            //console.log("jenkins is true");
            http.get('http://bkz2jalw7c:3bdcf7bc40f582a4ae7ff52f77e90b24@tvcntysyea-jenkins.services.clever-cloud.com:4003/job/semanticbus-pic-3/build?token=semantic_bus_token', function(res) {
              console.log("jenkins JOB production triggered")
            })
          }
          // console.log('Listening on port  ');
          // console.log(this.address().port);
          //console.log('new message from master 18');
          //console.log(this.address());

        })

        // Lets encrypt response

        app.get('/.well-known/acme-challenge/:challengeHash', function(req, res) {
          var params = req.params.challengeHash.substr(0, req.params.challengeHash.length)
          var hash = params + ".rCIAnB6OZN-jvB1XIOagkbUTKQQmQ1ogeb5DUVFNUko";
          res.send(hash)
        });

        /// Nous Securisons desormais IHM par un appel AJAX
        /// à lentrée sur la page application.html

        server.on('error', function(err) {
          console.log(err)
        })
      }

      var onError = function(err) {
        console.log('disconnected ', err);
        if (err.command == 'ERROR') {
          console.log('disconnected body', err.body);
        }
      }
    }
  });
})
