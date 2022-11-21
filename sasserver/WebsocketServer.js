//
// WebSocket server class
//

"use strict";// Optional. You will see this name in eg. 'ps' or 'top' command

var http = require('http');
var https = require('https');
const fs = require("fs");
var SASManager;
var dbcon;

/*
const WebSocket = require("ws").Server;
const HttpsServer = require('https').createServer;


server = HttpsServer({
    cert: fs.readFileSync(config.ssl_cert_path),
    key: fs.readFileSync(config.ssl_key_path)
})
socket = new WebSocket({
    server: server
});
*/

module.exports = class WebsocketServer {
  constructor( mainclass )
  {    
    process.title = 'sas';// Port where we'll run the websocket server
    this.webSocketsServerPort = mainclass.websocketport;// websocket and http servers
    this.webSocketServer = require('websocket').server;
    dbcon = mainclass.dbcon; // database connection
    SASManager = mainclass.SASManager; // SAS Manager

    console.log('Create on port: ' + this.webSocketsServerPort );
    console.log('SASManager2: ' + SASManager );

    //
    // Global variables
    //

    // latest 100 messages
    var history = [ ];
    // list of currently connected clients (users)
    var clients = [ ];

    //
    // Helper function for escaping input strings
    //

    function htmlEntities(str)
    {
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    //
    // HTTP server
    //

    this.server = null;
    if( mainclass.secured == true )
    {
		this.server = https.createServer( {
			cert: fs.readFileSync( mainclass.sslCertPath ),
			key: fs.readFileSync( mainclass.sslKeyPath )
			}, function( request, response ) 
    	{
    	  // Not important for us. We're writing WebSocket server,
    	  // not HTTP server
    	});
	}
	else
	{
    	this.server = http.createServer( function( request, response ) 
    	{
    	  // Not important for us. We're writing WebSocket server,
    	  // not HTTP server
    	});
	}

    console.log('Create on port 2: ' + this.webSocketsServerPort );
    //this.server.listen( 1337, function()
    var globalWSPort = this.webSocketsServerPort;
    this.server.listen( this.webSocketsServerPort, function()
    {
      console.log( (new Date()) + ' Server is listening on port ' + globalWSPort );
    });

    //
    // WebSocket server
    //

    this.wsServer = new this.webSocketServer({
      // WebSocket server is tied to a HTTP server. WebSocket
      // request is just an enhanced HTTP request. For more info 
      // http://tools.ietf.org/html/rfc6455#page-6
      httpServer: this.server
    });

    // This callback function is called every time someone
    // tries to connect to the WebSocket server
    this.wsServer.on('request', function(request)
    {
      console.log( (new Date() ) + ' Connection from origin ' + request.origin + '.');  
      // accept connection - you should check 'request.origin' to
      // make sure that client is connecting from your website
      // (http://en.wikipedia.org/wiki/Same_origin_policy)

      var connection = request.accept( null, request.origin );

      // we need to know client index to remove them on 'close' event
      var index = clients.push( connection ) - 1;
      var userName = false;
      //var userColor = false;  console.log( (new Date() ) + ' Connection accepted.' );  // send back chat history

      //if( history.length > 0 ) 
      //{
      //  connection.sendUTF( JSON.stringify({ type: 'history', data: history} ) );
      //}  // user sent some message
  
      connection.on('message', function( message ) 
      {
        if (message.type === 'utf8') 
        { 

          try {
            var resp = "";
            var msg = null;
            var pmessage = message.utf8Data.replace(/\\"/g, '"');

            console.log("=========================================");

            console.log("Message arrived on WS: " + JSON.stringify( message ) + " removed " + pmessage );

            if( JSON.stringify( message ).indexOf( "Connection opened" ) != -1 )
            {

            }
            else
            {
              msg = JSON.parse( pmessage );
            }

            console.log("Message arrived on WS2: " + JSON.stringify( msg ) );

            if( msg != null && msg.type == "msg" )
            {
              console.log("Message is internal message, authid: " + msg.data.authid + " sessionid "+ msg.data.sessionid + " sasid " + msg.data.sasid );

              //{"type":"msg","data":{"type":"request","requestid":"fconn-req-vsuc024d-ijhhazol-trs083wd","path":"system.library/sas/register","data":{"authId":"e59317d1b4f1ed8fb397c08845130fce","type":"open"},"authid":"e59317d1b4f1ed8fb397c08845130fce","sessionid":"e59317d1b4f1ed8fb397c08845130fce"}}
              if( msg.data.path == "system.library/sas/register" )
              { // register( con, sessionid, username, type, sasid, force, appname )
                resp = SASManager.register( connection, msg.data.sessionid, msg.data.username, msg.data.stype, msg.data.sasid, msg.data.force, msg.data.appname );
              }

              //{"type":"msg","data":{"type":"request","requestid":"fconn-req-7gdno8qj-7mfc0hvq-b6cssmyx","path":"system.library/sas/unregister","data":{"sasid":"140735340906368"},"authid":"e59317d1b4f1ed8fb397c08845'
              else if( msg.data.path == "system.library/sas/unregister" )
              {
                resp = SASManager.unregister( connection, msg.data.sessionid, msg.data.sasid );
              }

              else if( msg.data.path == "system.library/sas/accept" )
              {
                resp = SASManager.accept( connection, msg.data.sessionid, msg.data.sasid, msg.data.username, msg.data.force );
              }

              else if( msg.data.path == "system.library/sas/decline" )
              {
                resp = SASManager.decline( connection, msg.data.sessionid, msg.data.sasid );
              }

              else if( msg.data.path == "system.library/sas/share" )
              {
                resp = SASManager.share( connection, msg.data.sessionid, msg.data.sasid, msg.data.userlist, msg.data.message );
              }

              else if( msg.data.path == "system.library/sas/unshare" )
              {
                resp = SASManager.unshare( connection, msg.data.sessionid, msg.data.sasid, msg.data.userlist );
              }

              else if( msg.data.path == "system.library/sas/send" )
              {
                resp = SASManager.send( connection, msg.data.sessionid, msg.data.sasid, msg.data.usernames, msg.data.msg );
              }

              else if( msg.data.path == "system.library/sas/sendowner" )
              {
                resp = SASManager.sendowner( connection, msg.data.sessionid, msg.data.sasid, msg.data.msg );
              }

              else if( msg.data.path == "system.library/sas/putvar" )
              {
                //putvar( con, sessionid, sasid, val, valid, mode )
                resp = SASManager.putvar( connection, msg.data.sessionid, msg.data.sasid, msg.data.var, msg.data.varid, msg.data.mode );
              }

              else if( msg.data.path == "system.library/sas/getvar" )
              {
                resp = SASManager.getvar( connection, msg.data.sessionid, msg.data.sasid, msg.data.varid );
              }
            }
            else
            {
              connection.sendUTF( resp );
            }
            
          } catch(err) {
            console.log(err.message);
            console.log(err.stack);
            const [, lineno, colno] = err.stack.match(/(\d+):(\d+)/);
            console.log('Line:', lineno);
            console.log('Column:', colno);
            //alert(e); // error in the above string (in this case, yes)!
            //var vDebug = ""; 
            //for (var prop in err) 
            //{  
            //  vDebug += "property: "+ prop+ " value: ["+ err[prop]+ "]\n"; 
            //} 
            //vDebug += "toString(): " + " value: [" + err.toString() + "]"; 

            //console.log("ERROR: " + vDebug + "\n" + err );
          }

          // accept only text
          // first message sent by user is their name     if (userName === false) {
          // remember user name
          //userName = htmlEntities(message.utf8Data);
          // get random color and send it back to the user
          //userColor = colors.shift();
          //connection.sendUTF('your message was: ' + message.utf8Data );
          //connection.sendUTF( JSON.stringify({ type:'color', data: userColor }) );

          //console.log((new Date()) + ' User is known as: ' + userName  + ' with ' + userColor + ' color.');      
        }
        /*
        else
        { // log and broadcast the message
          console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
        
          // we want to keep history of all sent messages
          var obj = {
            time: (new Date()).getTime(),
            text: htmlEntities(message.utf8Data),
            author: userName,
            color: userColor
          };
          history.push(obj);
          history = history.slice(-100);        // broadcast message to all connected clients
          var json = JSON.stringify({ type:'message', data: obj });
          for( var i=0; i < clients.length; i++ ) 
          {
            clients[i].sendUTF(json);
          }
        }*/
      });

      // user disconnected

      connection.on('close', function(connection)
      {
        if( userName !== false && userColor !== false ) 
        {
          console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
          // remove user from the list of connected clients
          //clients.splice(index, 1);
          // push back user's color to be reused by another user
          //colors.push(userColor);
        }
      });
    });
  }
};
