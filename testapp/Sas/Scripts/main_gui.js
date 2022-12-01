



function SetActiveTarget( o )
{
	var eles = ge( 'Targets' ).getElementsByClassName( 'Target' );
	for( var a = 0; a < eles.length; a++ )
	{
		if( eles[a] == o )
		{
			eles[a].classList.add( 'Active' );
		}
		else
		{
			eles[a].classList.remove( 'Active' );
		}
	}
};

function Send( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'send' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

function Sendowner( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'sendowner' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

function Share( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'share' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

function Unshare( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'unshare' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

function Accept( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'accept' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

function Decline( mode )
{
	if( ws != null )
	{
	    sendMessageD( 'decline' );
	}
	else
	{
		Alert( 'No WS!' );
	}
};

//
// Register
//

var ws = null;

function Register( mode )
{
	packet = {
		url: 'sas/register',
		id: 1
	}

	var l = new Library( 'system.library' );
	l.onExecuted = function( r, d )
	{
		console.log( 'We sent stuff!', 'Here was the result: ' + r + ' ' + d );
		
		if( r != null )
		{
		    msg = JSON.parse( r );
		    //{'server':'215.148.12.50','sasid':2}
		
		    if( msg != null && ws == null )
            {
                ws = new WebSocket("wss://"+ msg.server +":1337/sas");
                ws.onopen = function() 
                {    
                    // Web Socket is connected, send data using send()
                    ws.send("Connection opened");
                    console.log("Message is sent: connection opened");
            
                    sendMessageD( 'register' );
                };
				
                ws.onmessage = function (evt)
                { 
                    var received_msg = evt.data;
                    console.log("Message is received: " + received_msg );
                };
				
                ws.onclose = function() 
                { 
                    // websocket is closed.
                    alert("Connection is closed..."); 
                };
            }
		}
	}
	l.execute( packet.url, { id: packet.id } );
};

function sendMessageD( type )
         {
			   console.log('MSG type of message to send: ' + type );
			   if( ws != null )
			   {
               var sasid = 1;//document.getElementById("sasid").value;
			   var authid = Application.authId;// 'c7fdba3278838c85cc4c62b48b3d6478693a2983';	// user stefkos, ID 3
			   var varid = 1;
			   var username = 'jacek';
               var msg = "{\"type\":\"msg\",\"data\":{\"type\":\"request\",\"requestid\":\"fconn-req-vsuc024d-ijhhazol-trs083wd\",\"path\":\"system.library/sas/";
			   var sndmsg = "hello";
			   var usernames = "jacek,placek";
			   var force = false;
			   
			   // share
			   var userlist = "jacek,stefkos";
			   var sharemessage = "msg";

               if( type =='register')
               {
                  if( sasid > 0 )
                  {
                     msg += "register\",\"data\":{\"authid\":\""+authid+"\"},\"authid\":\""+authid+"\",\"username\":\"" + username +"\",\"authid\":\"" + authid +"\",\"stype\":\"open\",\"sasid\":\"" + sasid +"\"}}";
                  }
                  else
                  {
                     msg += "register\",\"data\":{\"authid\":\""+authid+"\"},\"authid\":\""+authid+"\",\"username\":\"" + username +"\",\"authid\":\"" + authid +"\",\"stype\":\"open\"}}";
                  }
               } else if( type == 'unregister' )
               {
                  msg += "unregister\",\"data\":{\"sasid\":\""+ sasid +"\",\"authid\":\""+ authid +"\"},\"authid\":\""+authid+"\"}}";
               } else if( type == 'share' )
               {
                  msg += "share\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"userlist\":\""+ userlist +"\",\"message\":\""+ sharemessage +"\"}}";
               } else if( type == 'unshare' )
               {
                  msg += "unshare\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"userlist\":\""+ userlist +"\"}}";
               }else if( type == 'accept' )
               {
                  msg += "accept\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"username\":\""+ username +"\",\"force\":"+ force +"}}";
               } else if( type == 'decline' )
               {
                  msg += "decline\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\"}}";
               } else if( type == 'send' )
               {
                  msg += "send\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"msg\":\""+ sndmsg +"\",\"usernames\":\""+ usernames +"\"}}";
               } else if( type == 'sendowner' )
               {
                  msg += "sendowner\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"msg\":\""+ sndmsg +"\"}}";
               } else if( type == 'getvar' )
               {
                  msg += "getvar\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"varid\":"+ varid +"}}";
               } else if( type == 'putvar' )
               {
                  msg += "putvar\",\"data\":{},\"authid\":\""+authid+"\",\"sasid\":\""+ sasid +"\",\"varid\":"+ varid +",\"var\":\"vardata\"}}";
               }
               console.log('MSG to send: ' + msg );
				   ws.send( msg );
			   }
         };
         
