
//
// SASManager class
//
// This class contain all "business" functionality for SAS
//

const List = require('./list.js');
const Map = require('./map.js');
const SAS = require('./SAS.js');
var mysql = require('promise-mysql2');
const Database = require('./Database.js');
const UserSession = require('./UserSession.js');
const { isGeneratorFunction } = require('util/types');

let globalAuthid = '5d0e8579f3dec0477449c1d004f3c089';

//
// SAS type
// 0 - closed
// 1 - open
//

module.exports = class SASManager
{
	//
	//
	//

    constructor( ) 
    {
        this.globalID = 0;
        this.sasMap = new Map();// new List( null );
    }

/**
	*
	* <HR><H2>system.library/app/register</H2>Register new Application Shared Session
	*
	* @param con - (required) websocket connection
	* @param sessionid - (required) session id of logged user
	* @param authid - (required) authentication id (provided by application)
	* @param type - type of application session 'close'(default), 'open' for everyone
	* @param sasid - if passed then it will be used to join already created SAS
	* @param force - if set to true then session is created no mather what
	* @param appname - application name

	* @return { SASID: <number> } when success, otherwise response with error code
    */
    
   register( con, sessionid, authid, type, sasid, force, appname )
   {
       this.globalID++;
       var id = this.globalID;

	   // we set default value
	   if( force == undefined )
	   {
		   force = false;
	   }

	   console.log( "response in promise, con : " + con + " authid " + authid + " type " + type + " sasid " + sasid + " force " + force );

	   if( authid == null )
	   {
		   con.sendUTF( "{'response':'authid parameter is missing','code':'14'}" );
		   return;
	   }

	   if( sasid == undefined )
	   {
		   sasid = null;
	   }
       
	   //var usersProm = Database.findUserSessionByAuthID( authid );
	   var usersProm = Database.findUserSessionByAuthID( globalAuthid );

	   console.log("users: " + usersProm );
	   usersProm.then((resp) => {

		console.log( "response in promise, found objects " + resp.length + " con : " + con + " authid " + authid + " type " + type + " sasid " + sasid + " force " + force );

		if( resp.length > 0 )	// authid exist, user is authenticated to do something with SAS
		{
			console.log( " resp.length > 0, sasid " + sasid );
			if( sasid != null )
			{
				console.log("register sasid != null" );
				var sasFromList = this.sasMap.get( sasid );
				if( sasFromList != null )	//
				{
					if( sasFromList.type == 'open' )
					{
						var sasEntry = sasFromList.getUserSession( authid );
						if( sasEntry == null )
						{
							sasFromList.addUserSession( sessionid, authid, con, true, true );	// session exist so we only add 
						}
						con.sendUTF( "{'type':'client-accept','data':'"+ authid +"'}" );
					}
					else	// connection was created by someone and its marked as "closed" so user have to ask admin for access
					{
						// if session exit only force argument can recreate it
						if( force == true  )
						{
							var sasEntry = sasFromList.getUserSession( authid );
							if( sasEntry == null )
							{
								sasFromList.addUserSession( sessionid, authid, con, true, false );	// session exist so we only add 
							}
							con.sendUTF( "{'type':'client-accept','data':'"+ authid +"'}" );
						}
						else
						{
							con.sendUTF( "{'error': 3}" );
						}
					}
				}
				else
				{
					console.log("More elements: " + JSON.stringify( resp[0]) );
					var newsas = new SAS( con, id, type );		// create SAS
					if( newsas != null )
					{
						newsas.addUserSession( sessionid, authid, con, true, true );		// put authentication and connection to SAS

						this.sasMap.add( id, newsas );				// add new SAS to global list
					}

					con.sendUTF( "{'SASID':" + id + ",'type':" + type + "}" );
				}
			}	// sasid = null
			else
			{
				// SAS do not exist, we must create it
				console.log("register sasid != null" );
				var sasFromList = this.sasMap.get( sasid );
				if( sasFromList != null )	//
				{
					if( sasFromList.type == 'open' )
					{
						var sasEntry = sasFromList.getUserSession( authid );
						if( sasEntry == null )
						{
							sasFromList.addUserSession( authid, con, true, true );	// session exist so we only add 
						}
						con.sendUTF( "{'type':'client-accept','data':'"+ authid +"'}" );
					}
					else	// connection was created by someone and its marked as "closed" so user have to ask admin for access
					{
						var sasEntry = sasFromList.getUserSession( authid );
						if( sasEntry == null )
						{
							sasFromList.addUserSession( authid, con, true, false );	// session exist so we only add 
						}
						con.sendUTF( "{'type':'client-accept','data':'"+ authid +"'}" );
					}
				}
				else
				{
					console.log("More elements: " + JSON.stringify( resp[0]) );
					var newsas = new SAS( con, id, type );		// create SAS
					if( newsas != null )
					{
						newsas.addUserSession( authid, con, true, true );		// put authentication and connection to SAS

						this.sasMap.add( id, newsas );				// add new SAS to global list
					}

					con.sendUTF( "{'SASID':" + id + ",'type':" + type + "}" );
				}
				//con.sendUTF( "{'error': 3}" );
			}
		}
		else	// authid was not found in DB
		{
			con.sendUTF( "{'response':'permission denied','code':''}" );
		}
	} );

       return null;   // 0 = error
   }

   /**
   *
   * <HR><H2>system.library/app/unregister</H2>Unregister Application Shared Session
   *
   * @param authid - (required) authentication id used by logged user
   * @param sasid - (required) shared session id which will be removed

   * @return {SASID:<number>} when success, otherwise error code
   */
   
   unregister( con, authid, sasid )
   {
	var usersProm = Database.findUserSessionByAuthID( globalAuthid );

	console.log("unregister: " + usersProm );
	usersProm.then((resp) => {

		if( resp.length <= 0 )	// authid exist, user is authenticated to do something with SAS
		{
			con.sendUTF( "{'response':'permission denied','code':''}" );
			return;
		}

		if( sasid != null )
		{
			var sasFromList = this.sasMap.get( sasid );
			if( sasFromList != null )
			{
				if( sasFromList.type == 'open' )
				{
					// if there is entry we remove it
					// if its last entry we remove whole SAS
					var sasEntry = sasFromList.getUserSession( authid );
					if( sasEntry != null )
					{
						sasFromList.removeUserSession( authid );
					}
					
					if( sasFromList.getConnectionNumber() <= 0 )
					{
						this.sasMap.remove( sasid );
					}

					con.sendUTF( "{'SASID':" + sasid + "}" );
				}
				else	// closed SAS
				{
					// we are trying to get user first, if he will be admin then he will be able to delete SAS
					var sasEntry = sasFromList.getUserSession( authid );
					if( sasEntry != null )
					{
						if( sasEntry.isAdmin() )
						{
							for (var entry in sasFromList )
							{
								if( entry.getConnection() != con )
								{
									entry.sendMessage( "{'type':'sasid-close','data':'" + entry.getUsername() + "'}" );
									entry.getConnection().close();
								}
							}

							// now we clear the list
							sasFromList.clear();
							// and remove SAS from list
							this.sasMap.remove( sasid );
						}
						else
						{
							//int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
							for (var entry in sasFromList )
							{
								if( entry.isAdmin() )
								{
									entry.sendMessage( "{'type':'client-close','data':'" + resp[0].Name + "'}" );
									break;
								}
							}
						}
						con.sendUTF( "{'SASID':" + sasid + "}" );
					}
				}
			}
			
		}
		else
		{
			con.sendUTF( "{'error': 3}" );
		}
	} );	// get user session
   }

   /*
   			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid,  &end, 0 );
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
			
			char buffer[ 1024 ];
			
			if( as != NULL )
			{
				// if session is open it is allowed to quit session by the owner
				// if AS have less users then 1 then session is removed
				if( as->sas_Type == SAS_TYPE_OPEN )
				{
					int err = 0;

					err = SASSessionRemUserSessionAny( as, loggedSession );
					
					DEBUG("AS will be removed? %d number of users on sas %d\n", err, as->sas_UserNumber );
					// if user was removed and he was last then we remove SAS
					if( err == 0 && as->sas_UserNumber <= 0 )
					{
						err = SASManagerRemSession( l->sl_SASManager, as );
					}
					
					if( err == 0 )
					{
						int size = sprintf( buffer, "{\"SASID\":\"%lu\"}", asval );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS unregister", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					DEBUG("[SASWebRequest] Found appsession id %lu\n", as->sas_AppID );
					// if our session is owner session all connections must be closed
				
					UserSession *locus = (UserSession *)as->sas_UserSessionList->usersession;
					int err = 0;
				
					char tmpmsg[ 255 ];
				
					if( locus->us_User == loggedSession->us_User )
					{
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"sasid-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						DEBUG("[SASWebRequest] As Owner I want to remove session and sasid\n");
					
						err = SASSessionSendMessage( as, loggedSession, tmpmsg, msgsize, NULL );
					
						// we are not owner, we must send message to owner too
						if( loggedSession != locus )
						{
							err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
						}
					
						err = SASManagerRemSession( l->sl_SASManager, as );
					}
					//
					// we are not session owner, we can onlybe removed from assid
					//
					else
					{
						int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
						err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					
						err = SASSessionRemUserSession( as, loggedSession );
					}
				
					if( err == 0 )
					{
						int size = sprintf( buffer, "{\"SASID\":\"%lu\"}", asval );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS unregister", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
   */

   /**
	*
	* <HR><H2>system.library/app/accept</H2>Accept invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required if authid is not provided) shared session id
	* @param authid - (required if sasid is not provided) application authentication id
	* @param force - force to create SAS

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    

	accept( sessionid, sasid, authid, force )
	{
		var usersProm = Database.findUserSessionByAuthID( globalAuthid );

		console.log("unregister: " + usersProm );
		usersProm.then((resp) => {
	
			if( resp.length > 0 )	// authid exist, user is authenticated to do something with SAS
			{
				con.sendUTF( "{'response':'permission denied','code':''}" );
				return;
			}
	
			if( sasid != null )
			{
				var sasFromList = this.sasMap.get( sasid );
				if( sasFromList != null )
				{
					if( sasFromList.type == 'open' )
					{
						// if there is entry we remove it
						// if its last entry we remove whole SAS
						var us = sasFromList.getUserSession( authid );
						if( us == null )
						{
							sasFromList.addUserSession( authid, con, true, false );	// session exist so we only add 
						}
						else
						{
							if( !us.isAccepted() )
							{
								us.setAccepted( true );
							}
						}

						for (var entry in sasFromList )
						{
							entry.sendMessage( "{'type':'client-accept','data':'" + resp[0].Name + "'}" );
						}
	
						con.sendUTF( "{'SASID':" + sasid + "}" );
					}
					else	// closed SAS
					{

						for (var entry in sasFromList )
						{
							if( entry.getSessionid() == sessionid )
							{
								if( !entry.isAccepted() )
								{
									entry.setAccepted( true );
								}

								entry.getSessionOwner().getConnection().sendUTF( "{'type':'client-accept','data':'" + resp[0].Name + "'}" );
							}
						}
/*
					SASUList *li = as->sas_UserSessionList;
		
					// Find invitee user with authid from user list in allowed users
					while( li != NULL )
					{
						DEBUG("[SASWebRequest] Setting %s userfromlist %s userlogged %s  currauthid %s   entryptr %p\n", authid, li->usersession->us_User->u_Name, loggedSession->us_User->u_Name, li->authid, li );
					
						DEBUG("[SASWebRequest] sessionfrom list %p loggeduser session %p\n",  li->usersession, loggedSession );
						if( li->usersession == loggedSession )
						{
							if( li->authid[ 0 ] != 0 )
							{
								FERROR("AUTHID IS NOT EMPTY %s!!!\n", li->authid );
							}
						
							if( li->status == SASID_US_INVITED )
							{
								li->status = SASID_US_ACCEPTED;
							}
						
							DEBUG("[SASWebRequest] ASN set %s pointer %p\n", li->authid, li );
							strcpy( li->authid, authid );
							DEBUG("[SASWebRequest] Setting authid %s user %s\n", authid, li->usersession->us_User->u_Name );
						
							as->sas_UserNumber++;
						
							char tmpmsg[ 255 ];
							int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-accept\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
						
							int err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
							if( err != 0 )
							{
							
							}
							error = 0;
							break;
						}
						li = ( SASUList * )li->node.mln_Succ;
					}
*/

					}
				}
				else if( force == true )	// if SAS doesnt exist, create it
				{
					{
						console.log("More elements: " + JSON.stringify( resp[0]) );
						var newsas = new SAS( con, id, type );		// create SAS
						if( newsas != null )
						{
							newsas.addUserSession( sessionid, authid, con, true, true );		// put authentication and connection to SAS
	
							this.sasMap.add( id, newsas );				// add new SAS to global list
						}
	
						con.sendUTF( "{'SASID':" + id + ",'type':" + type + "}" );
					}
				}
				/*
				

			}
			else if( force == TRUE )	// if session do not exist and system is forced to create new SAS
			{
				SASSession *as = SASSessionNew( l, authid, 0, loggedSession );
				if( as != NULL )
				{
					as->sas_Type = SAS_TYPE_OPEN;	// we can only create open sessions
					int err = SASManagerAddSession( l->sl_SASManager, as );
					if( err == 0 )
					{
						int size = sprintf( buffer, "{ \"SASID\": \"%lu\",\"type\":%d }", as->sas_SASID, as->sas_Type );
						HttpAddTextContent( response, buffer );
					}
					else
					{
						char dictmsgbuf[ 256 ];
						char dictmsgbuf1[ 196 ];
						snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_FUNCTION_RETURNED], "SAS register", err );
						snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_FUNCTION_RETURNED );
						HttpAddTextContent( response, dictmsgbuf );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_CREATE_SAS], DICT_CANNOT_CREATE_SAS );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
			else	// session not found and system is not forced to create it
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}

				*/
				
			}
			else
			{
				con.sendUTF( "{'error': 3}" );
			}
		} );	// get user session
	}

    /**
	* @ingroup WebCalls
	* 
	* <HR><H2>system.library/app/decline</H2>Decline invitation from assid owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required) shared session id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    
	decline( sessionid, sasid )
	{
		var usersProm = Database.findUserSessionByAuthID( globalAuthid );

		console.log("unregister: " + usersProm );
		usersProm.then((resp) => {
	
			if( resp.length > 0 )	// authid exist, user is authenticated to do something with SAS
			{
				con.sendUTF( "{'response':'permission denied','code':''}" );
				return;
			}
	
			if( sasid != null )
			{

				//
				// Go through all user sessions, compare sessionid and remove it from SAS
				//

				for (var session in this.sasMap )
				{
					if( session.getSessionid() == sessionid )
					{
						this.sasMap.remove();
					}
				}

				entry.getSessionOwner().getConnection().sendUTF( "{'type':'client-decline','data':'" + resp[0].Name + "'}" );
			}
		} );	// get user session
	}

	/*

			char *end = NULL;
			int assidlen = strlen( assid );
			FUQUAD asval = strtoull( assid, &end, 0 );
			char buffer[ 1024 ];
			
			// Try to fetch assid session from session list!
			SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
		
			// We found session!
			if( as != NULL )
			{
				// Find invitee user with authid from user list in allowed users
				SASUList *li = SASSessionGetListEntryBySession( as, loggedSession );
				int error = 1;
				
				if( li != NULL )
				{
					char tmpmsg[ 255 ];
					int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-decline\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
					
					DEBUG("[SASWebRequest] Session found and will be removed\n");
					int err = SASSessionSendOwnerMessage( as, loggedSession, tmpmsg, msgsize );
					if( err != 0 )
					{
						
					}
					
					 err = SASSessionRemUserSession( as, loggedSession );
					 error = 0;
				}
				
				if( error == 0 )
				{
					int size = sprintf( buffer,"{\"response\":\"%s\",\"identity\":\"%s\"}", "success", as->sas_UserSessionList->usersession->us_User->u_Name );
					HttpAddTextContent( response, buffer );
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_USER_NOT_FOUND] , DICT_USER_NOT_FOUND );
					HttpAddTextContent( response, dictmsgbuf );
				}
			}
			else
			{
				char dictmsgbuf[ 256 ];
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
				HttpAddTextContent( response, dictmsgbuf );
			}
		}

		if( assid != NULL )
		{
			FFree( assid );
		}
	*/


    /**
	* 
	* <HR><H2>system.library/app/share</H2>Share your Application Shared Session with other users
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to invite to Shared Application Session. Function expect user names separated by comma
	* @param message - information which we want to send invited people

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */
    
	share( sessionid, sasid, users, message )
	{
		var usersProm = Database.findUserSessionByAuthID( globalAuthid );

		console.log("unregister: " + usersProm );
		usersProm.then((resp) => {
	
			if( resp.length > 0 )	// authid exist, user is authenticated to do something with SAS
			{
				con.sendUTF( "{'response':'permission denied','code':''}" );
				return;
			}
	
			if( sasid != null )
			{

				//
				// Go through all user sessions, compare sessionid and remove it from SAS
				//

				for (var session in this.sasMap )
				{
					if( session.getSessionid() == sessionid )
					{
						this.sasMap.remove();
					}
				}

				entry.getSessionOwner().getConnection().sendUTF( "{'type':'client-decline','data':'" + resp[0].Name + "'}" );
			}
		} );	// get user session
	}

	/*
		else if( strcmp( urlpath[ 0 ], "share" ) == 0 )
	{
		char *assid = NULL;
		char *userlist = NULL;
		char *msg = NULL;
		char *sessid = NULL;
		
		struct TagItem tags[] = {
			{ HTTP_HEADER_CONTENT_TYPE, (FULONG) StringDuplicate( "text/html" ) },
			{ HTTP_HEADER_CONNECTION, (FULONG) StringDuplicate( "close" ) },
			{ TAG_DONE, TAG_DONE }
		};
		
		response = HttpNewSimple( HTTP_200_OK,  tags );
		
		HashmapElement *el =  HashmapGet( request->http_ParsedPostContent, "sasid" );
		if( el != NULL )
		{
			assid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		SASSession *as = NULL;
		char applicationName[ 1024 ];
		applicationName[ 0 ] = 0;
		
		if( assid != NULL )
		{
			char *end;
			FUQUAD asval = strtoul( assid,  &end, 0 );
			DEBUG("[SASWebRequest] ASSID %s endptr-startp %d\n", assid, (int)(end-assid) );
			
			as = SASManagerGetSession( l->sl_SASManager, asval );
		}
		
		SQLLibrary *sqllib  = l->LibrarySQLGet( l );
		if( sqllib != NULL )
		{
			//
			// we must get application name to send it with invitation
			//

			char q[ 1024 ];
			if( as != NULL )
			{
				sqllib->SNPrintF( sqllib, q, sizeof(q), "SELECT `Name` FROM `FUserApplication` ua, `FApplication` a  WHERE ua.AuthID=\"%s\" and ua.ApplicationID = a.ID LIMIT 1",( char *)as->sas_AuthID );

				void *res = sqllib->Query( sqllib, q );
				if( res != NULL )
				{
					char **row;
					if( ( row = sqllib->FetchRow( sqllib, res ) ) )
					{
						strcpy( applicationName, row[ 0 ] );
					}
					sqllib->FreeResult( sqllib, res );
				}
			}
			l->LibrarySQLDrop( l, sqllib );
		}
		
		if( as == NULL  )
		{
			char dictmsgbuf[ 256 ];
			if( assid == NULL )
			{
				char dictmsgbuf1[ 196 ];
				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "sasid" );
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			}
			else
			{
				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
			}
			HttpAddTextContent( response, dictmsgbuf );
			return response;
		}
		
		// Register invite message so we can send it to users
		el =  HashmapGet( request->http_ParsedPostContent, "message" );
		if( el != NULL )
		{
			msg = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		// Get sessionid
		
		el = HashmapGet( request->http_ParsedPostContent, "sessid" );
		if( el != NULL )
		{
			sessid = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		// Get list of usernames
		el = HashmapGet( request->http_ParsedPostContent, "users" );
		if( el != NULL )
		{
			userlist = UrlDecodeToMem( ( char *)el->hme_Data );
		}
		
		if( userlist != NULL || sessid != NULL )
		{
			DEBUG("[SASWebRequest] share: %s  as %p msg %s\n", userlist, as, msg );
			
			if( as != NULL && msg != NULL )
			{
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter++;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
					
				if( userlist != NULL )
				{
					char *resp = SASSessionAddUsersByName( as, loggedSession, userlist, applicationName, msg  );
					if( resp != NULL )
					{
						HttpAddTextContent( response, resp );
					
						FFree( resp );
					}
					else
					{
						HttpAddTextContent( response, "{\"invited\":[\"\"]}" );
					}
				}
				else if( sessid != NULL )
				{
					if( SASSessionAddUsersBySession( as, loggedSession, sessid, applicationName, msg  ) != NULL )
					{
						char tmp[ 512 ];
						snprintf( tmp, sizeof(tmp), "{\"invited\":[\"%s\"]}", sessid );
						HttpAddTextContent( response, tmp );
					}
					else
					{
						HttpAddTextContent( response, "{\"invited\":[\"\"]}" );
					}
				}
				else
				{
					char dictmsgbuf[ 256 ];
					snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_CANNOT_ADD_USERS] , DICT_CANNOT_ADD_USERS );
					HttpAddTextContent( response, dictmsgbuf );
				}
				
				if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
				{
					loggedSession->us_InUseCounter--;
					FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
				}
			}
		}
		else
		{
			char dictmsgbuf[ 256 ];
			char dictmsgbuf1[ 196 ];
			snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_PARAMETERS_MISSING], "users" );
			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_PARAMETERS_MISSING );
			HttpAddTextContent( response, dictmsgbuf );
			FERROR("users parameter is missing!\n");
		}
		
		if( sessid != NULL )
		{
			FFree( sessid );
		}
		if( msg != NULL )
		{
			FFree( msg );
		}
		if( assid != NULL )
		{
			FFree( assid );
		}
		if( userlist != NULL )
		{
			FFree( userlist );
		}
	*/


    /**
	* 
	* <HR><H2>system.library/app/unshare</H2>Unshare your Application Shared Session. Terminate
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to remove from Shared Application Session. Function expect user names separated by comma

	* @return list of users removed from SAS
    */
    




    /**
	* 
	* <HR><H2>system.library/app/send</H2>Send message to other users (not owner of sas)
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param usernames - users to which we want to send message. Function expect user names separated by comma
	* @param msg - (required) message which we want to send to users

	* @return {response:success}, when success, otherwise error code
	*/






    /**
	* 
	* <HR><H2>system.library/app/sendowner</H2>Send message to SAS owner
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param msg - (required) message which we will be send

	* @return {response:success}, when success, otherwise error code
    */
    









    /**
	* 
	* <HR><H2>system.library/app/takeover</H2>Take over other user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param username - (required) user name which will take over of SAS
	* @param deviceid - (required) deviceid of user device which will take over SAS

	* @return {response:success}, when success, otherwise error code
    */
    




    /**
	* 
	* <HR><H2>system.library/app/switchsession</H2>Switch user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param deviceid - (required) deviceid of user device to which user want to switch in SAS

	* @return {response:success}, when success, otherwise error code
    */
    





    /**
	* 
	* <HR><H2>system.library/app/putvar</H2>Put variable into Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param var - (required) variable which will be stored in SAS
	* @param varid - variable ID, if not provided new will be created. Otherwise updated
	* @param mode - set to "private" if you want to have private variable. Otherwise it will be public
	* @return {VariableNumber:<number>}, when number > 0 then variable was created/updated. Otherwise error number will be returned
    */
    







    /**
	* 
	* <HR><H2>system.library/app/getvar</H2>Get variable from Application Session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param varid - variable ID from which data will be taken
	* @return {VariableData:<data>} when success, otherwise error with code
	*/

}
