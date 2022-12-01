/*©lgpl**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the LGPL License, *
* found in the file license_lgpl.txt.                                           *
*                                                                              *
*****************************************************************************©*/

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
const friendos = require('./friendos.js');
//const schedule = require('node-schedule');

let globalAuthid = '5d0e8579f3dec0477449c1d004f3c089';

//
// SAS type
// 0 - closed
// 1 - open
//

module.exports = class SASManager {
    //
    //
    //

    constructor(id) {
        this.SERVER_ID = id;
        this.globalID = 0;
        this.sasMap = new Map();

        // clean not used sas from time to time

        //const job = schedule.scheduleJob(this, '0 17 ? * 0,4-6', function() {
        //    console.log('Clean SAS');
        //    this.cleanSAS();
        //});
    }


    /*
      Clean SAS
    */

    cleanSAS() {

    }

    /**
    	*
    	* <HR><H2>system.library/app/register</H2>Register new Application Shared Session
    	*
    	* @param con - (required) websocket connection
    	* @param requestid - id of request
    	* @param authid - (required) authenticationid
    	* @param username - (required) user name
    	* @param type - type of application session 'close'(default), 'open' for everyone
    	* @param sasid - if passed then it will be used to join already created SAS
    	* @param force - if set to true then session is created no mather what
    	* @param appname - application name

    	* @return { SASID: <number> } when success, otherwise response with error code
        */

    register(con, requestid, authid, username, type, sasid, force, appname) {
        this.globalID++;
        var id = this.globalID;
        var sid = '' + id;

        // we set default value
        if (force == undefined) {
            force = false;
        }

        console.log("[register]response in promise, con : " + con + " username " + username + " type " + type + " sasid " + sasid + " force " + force);

        if (username == null) {
            con.sendUTF("{'response':'username parameter is missing','code':'14'}");
            return;
        }

        if (sasid == undefined) {
            sasid = null;
        }

        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[register] users: " + usersProm);
        usersProm.then((resp) => {

            console.log("[register] response in promise, found objects resp" + resp + " length " + resp.length + " con : " + con + " username " + username + " type " + type + " sasid " + sasid + " force " + force);

            if (resp.length > 0 && resp.ID != undefined) // username exist, user is authenticated to do something with SAS
            {
                console.log("[register] resp.length > 0, sasid " + sasid);
                if (sasid != null) {
                    console.log("[register] sasid != null");
                    var sasFromList = getSAS(sasid);
                    if (sasFromList != null) //
                    {
                        console.log("[register] SAS found by id, type: " + sasFromList.type);
                        if (sasFromList.type == 'open') {
                            var sasEntry = sasFromList.getUserSession(authid);
                            console.log("[register]open getting user by id " + authid + " entry " + sasEntry);
                            if (sasEntry == null) {
                                sasFromList.addUserSession(sessionid, username, 1, con, true, true); // session exist so we only add 
                            }
                            con.sendUTF("{'type':'client-accept','data':'" + authid + "'}");
                        } else // connection was created by someone and its marked as "closed" so user have to ask admin for access
                        {
                            // if session exit only force argument can recreate it
                            if (force == true) {
                                var sasEntry = sasFromList.getUserSession(sessionid);
                                console.log("[register]closed, but force=true getting user by id " + sessionid + " entry " + sasEntry);
                                if (sasEntry == null) {
                                    sasFromList.addUserSession(authid, username, 1, con, true, false); // session exist so we only add 
                                }
                                con.sendUTF("{'type':'client-accept','data':'" + username + "'}");
                            } else {
                                con.sendUTF("{'error': 3}");
                            }
                        }
                    } else {
                        console.log("[register] sas not found in list. More elements: " + JSON.stringify(resp[0]));
                        var newsas = new SAS(con, sid, type, appname); // create SAS
                        if (newsas != null) {
                            newsas.addUserSession(authid, username, 1, con, true, true); // put authentication and connection to SAS

                            putSAS(newsas, sid); // add new SAS to global list
                        }

                        con.sendUTF("{'SASID':" + sid + ",'type':" + type + "}");
                    }
                } // sasid = null
                else {
                    // SAS do not exist, we must create it
                    console.log("[register] sasid paramter missing");
                    var sasFromList = getSAS(sasid);
                    if (sasFromList != null) //
                    {
                        if (sasFromList.type == 'open') {
                            var sasEntry = sasFromList.getUserSession(authid);
                            if (sasEntry == null) {
                                sasFromList.addUserSession(sessionid, username, 1, con, true, true); // session exist so we only add 
                            }
                            con.sendUTF("{'type':'client-accept','data':'" + sessionid + "'}");
                        } else // connection was created by someone and its marked as "closed" so user have to ask admin for access
                        {
                            var sasEntry = sasFromList.getUserSession(authid);
                            if (sasEntry == null) {
                                sasFromList.addUserSession(sessionid, username, 1, con, true, false); // session exist so we only add 
                            }
                            con.sendUTF("{'type':'client-accept','data':'" + sessionid + "'}");
                        }
                    } else {
                        console.log("[register] More elements: " + JSON.stringify(resp[0]));
                        var newsas = new SAS(con, sid, type, appname); // create SAS
                        if (newsas != null) {
                            newsas.addUserSession(authid, username, 1, con, true, true); // put authentication and connection to SAS

                            putSAS(newsas, sid); // add new SAS to global list

                        }

                        con.sendUTF("{'SASID':" + sid + ",'type':" + type + "}");
                    }
                    //con.sendUTF( "{'error': 3}" );
                }

                console.log("[register] SAS created ID: " + sid + " number of entries " + this.sasMap.length);

                Database.updateSessionsInSASServer(this.SERVER_ID, true);
            } else // authid was not found in DB
            {
                con.sendUTF("{'response':'permission denied','code':''}");
            }
        });

        return null; // 0 = error
    }

    /**
    *
    * <HR><H2>system.library/app/unregister</H2>Unregister Application Shared Session
    *
    * @param con - (required) websocket connection
    * @param requestid - id of request
    * @param authid - (required) authentication id
    * @param sasid - (required) shared session id which will be removed

    * @return {SASID:<number>} when success, otherwise error code
    */

    unregister(con, requestid, authid, sasid) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[unregister]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {
                    if (sasFromList.type == 'open') {
                        // if there is entry we remove it
                        // if its last entry we remove whole SAS
                        var sasEntry = sasFromList.getUserSession(authid);
                        if (sasEntry != null) {
                            sasFromList.removeUserSession(authid);
                        }

                        if (sasFromList.getConnectionNumber() <= 0) {
                            this.sasMap.remove(sasid);
                        }

                        con.sendUTF("{'SASID':" + sasid + "}");
                    } else // closed SAS
                    {
                        // we are trying to get user first, if he will be admin then he will be able to delete SAS
                        var sasEntry = sasFromList.getUserSession(authid);
                        if (sasEntry != null) {
                            if (sasEntry.isAdmin()) {
                                for (var entry in sasFromList) {
                                    if (entry.getConnection() != con) {
                                        entry.sendMessage("{'type':'sasid-close','data':'" + entry.getUsername() + "'}");
                                        entry.getConnection().close();
                                    }
                                }

                                // now we clear the list
                                sasFromList.clear();
                                // and remove SAS from list
                                this.sasMap.remove(sasid);
                            } else {
                                //int msgsize = snprintf( tmpmsg, sizeof( tmpmsg ), "{\"type\":\"client-close\",\"data\":\"%s\"}", loggedSession->us_User->u_Name );
                                for (var entry in sasFromList) {
                                    if (entry.isAdmin()) {
                                        entry.sendMessage("{'type':'client-close','data':'" + resp[0].Name + "'}");
                                        break;
                                    }
                                }
                            }
                            con.sendUTF("{'SASID':" + sasid + "}");
                        }
                    }
                    Database.updateSessionsInSASServer(this.SERVER_ID, false);
                }

            } else {
                con.sendUTF("{'error': 3}");
            }
        }); // get user session
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
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) authentication id
	* @param sasid - (required if authid is not provided) shared session id
	* @param usernmae - (required if sasid is not provided) application authentication id
	* @param force - force to create SAS

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */


    accept(con, requestid, authid, sasid, username, force) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[accept]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {
                    if (sasFromList.type == 'open') {
                        // add user session already control if user can be added to list (his sessions)
                        sasFromList.addUserSession(authid, username, con, true, false); // session exist so we only add 

                        for (var entry in sasFromList) {
                            entry.sendMessage("{'type':'client-accept','data':'" + resp[0].Name + "'}");
                        }

                        con.sendUTF("{'SASID':" + sasid + "}");
                    } else // closed SAS
                    {
                        sasFromList.addUserSession(authid, username, con, true, false); // session exist so we only add 

                        sasFromList.getSessionOwner().sendMessage("{'type':'client-accept','data':'" + us.getUsername() + "'}");

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
                } else if (force == true) // if SAS doesnt exist, create it
                {
                    {
                        console.log("[accept] More elements: " + JSON.stringify(resp[0]));
                        var newsas = new SAS(con, id, type); // create SAS
                        if (newsas != null) {
                            newsas.addUserSession(authid, username, authid, con, true, true); // put authentication and connection to SAS

                            putSAS(newsas, id); // add new SAS to global list
                        }

                        con.sendUTF("{'SASID':" + id + ",'type':" + type + "}");
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

            } else {
                con.sendUTF("{'error': 3}");
            }
        }); // get user session
    }

    /**
	* @ingroup WebCalls
	* 
	* <HR><H2>system.library/app/decline</H2>Decline invitation from assid owner
	*
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) authentication id
	* @param sasid - (required) shared session id

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */

    decline(con, requestid, authid, sasid) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[decline]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {

                //
                // Go through all user sessions, compare sessionid and remove it from SAS
                //

                for (var session in this.sasMap) {
                    if (session.getSessionid() == authid) {
                        this.sasMap.remove();
                    }
                }

                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {
                    sasFromList.getSessionOwner().sendMessage("{'type':'client-decline','data':'" + resp[0].Name + "'}");
                }
            }
        }); // get user session
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
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) authentication id
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to invite to Shared Application Session. Function expect user names separated by comma
	* @param message - information which we want to send invited people

	* @return {response:success,identity:<user name>}, when success, otherwise error code
    */

    share(con, requestid, authid, sasid, userlist, message) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[share]: " + usersProm);
        usersProm.then((resp) => {
            console.log("[share]: response " + resp);

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            var resp = "{'response':[";

            if (sasid != null) {
                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {

                    //
                    // We have to add users to list
                    // List contain names of users which can join SAS
                    //

                    var arrayOfNames = userlist.split(",");
                    for (var usr of arrayOfNames) {
                        console.log("[share] add " + usr);
                        sasFromList.addInvatedUsers(usr);
                    }

                    // maybe we should make a list of users based on massages send to user session

                    resp += userlist;

                    //
                    // Get user sessions and check to which server they are assigned
                    // Send call to the server with SAS message about invitation
                    //

                    var serversAndSessions = Database.findServersAndSessionsBySessionID(userlist);
                    serversAndSessions.then((resp1) => {
                        console.log("[share]: findServersAndSessionsBySessionID: response " + resp1);

                        let sessionOwner = sasFromList.getSessionOwner();
                        let inviteMsg = "{'type':'msg','data':{'type':'sasid-request','data':{'sasid':" + sasid + ",'message':'" + message + "','owner':'" + sessionOwner.getUsername() + "','appname':'" + sasFromList.getAppname() + "'}}}";
                        let inviteMsgEnc = inviteMsg.toString('base64');

                        for (let session of resp1) {
                            console.log('[share] session ' + session);
                            for (let ent of session) {
                                console.log('[share] ent ' + ent.SessionID + ' Address ' + ent.Address);
                                if (ent.SessionID != null && ent.Address != null) // we have to be sure that address and session exist
                                {
                                    var fos = new friendos(ent.Address);
                                    fos.sendRequest('system.library/user/servermessage', 'sessionid=' + ent.SessionID + '&message=' + encodeURIComponent(inviteMsg) + '&usernames=jacek', null)
                                }
                            }
                        }

                    });
                }
            }
            resp += "]}";
            con.sendUTF(resp);
        }); // get user session
    }

    /*

    	
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

    */


    /**
	* 
	* <HR><H2>system.library/app/unshare</H2>Unshare your Application Shared Session. Terminate
	*
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) authentication id
	* @param sasid - (required ) shared session id
	* @param users - (required) users which we want to remove from Shared Application Session. Function expect user names separated by comma

	* @return list of users removed from SAS
    */


    unshare(con, requestid, authid, sasid, users) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[unshare]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            var resp = "{'response':[";

            if (sasid != null) {
                // maybe we should make a list of users based on massages send to user session

                resp += users;

                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {
                    // if users provided then remove only this people otherwise remove all

                    if (users == null) {
                        // admin
                        if (authid == sasFromList.getSessionOwner().getSessionid()) {
                            for (var session in sasFromList.getSessionlist().values()) {
                                let locmsg = "{'type':'msg','data':{'type':'" + sasFromList.getSessionOwner().getSessionid() + "', 'data':{'type':'" + sasFromList.getID() + "','data':{'identity':{'username':'" + sasFromList.getSessionOwner().getUsername() + "'},'data':{'type':'sasid-close','data':'" + session.getUsername() + "'}}}}}";

                                console.log("[unshare] (all): trying to send message to session " + session.getUsername());
                                session.sendMessage(locmsg);
                            }

                            for (var session in sasFromList.getSessionlist().values()) {
                                console.log("[unshare] remove " + session.getSessionid());
                                sasFromList.removeUserSession(session);
                            }
                        } else {
                            // do not allow people who are not admins to unshare SAS
                        }
                    } else {
                        // if you are admin of this SAS

                        if (authid == sasFromList.getSessionOwner().getSessionid()) {
                            for (var session in sasFromList.getSessionlist().values()) {
                                for (var usr of arrayOfNames) {
                                    if (usr == session.getUsername()) {
                                        let locmsg = "{'type':'msg','data':{'type':'" + sasFromList.getSessionOwner().getSessionid() + "', 'data':{'type':'" + sasFromList.getID() + "','data':{'identity':{'username':'" + sasFromList.getSessionOwner().getUsername() + "'},'data':{'type':'sasid-close','data':'" + session.getUsername() + "'}}}}}";

                                        console.log("send (all): trying to send message to session " + session.getUsername());
                                        session.sendMessage(locmsg);
                                    }
                                }
                            }

                            var arrayOfNames = users.split(",");

                            for (var usr of arrayOfNames) {
                                console.log(" remove " + usr);
                                sasFromList.removeUserSessionByUsername(usr);
                            }
                        } else {
                            // do not allow people who are not admins to unshare SAS
                        }
                    }
                }
            }
            resp += "]}";
            con.sendUTF(resp);

        }); // get user session
    }

    /*
    	if( rementr != NULL )
    {
    	char tmp[ 1024 ];
    	int msgsndsize = 0;
    	
    	if( adminSession != NULL )
    	{
    		asul = as->sas_UserSessionList;
    		while( asul != NULL )
    		{
    			int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", asul->authid, as->sas_SASID,  loggedSession->us_User->u_Name, asul->usersession->us_User->u_Name );
    			msgsndsize += WebSocketSendMessageInt( asul->usersession, tmp, len );
    		
    			asul = (SASUList *) asul->node.mln_Succ;
    		}
    	}
    	else
    	{
    		for( i=0 ; i < rementrnum ; i++ )
    		{
    			DEBUG("[SASSessionRemUserByNames] authid %s sasid %lu userptr %p usersessptr %p usersessuser ptr %p\n", rementr[ i ]->authid, as->sas_SASID,  loggedSession->us_User, rementr[ i ]->usersession, rementr[ i ]->usersession->us_User );
    			int len = sprintf( tmp, "{\"type\":\"msg\",\"data\": { \"type\":\"%s\", \"data\":{\"type\":\"%lu\", \"data\":{ \"identity\":{\"username\":\"%s\"},\"data\": {\"type\":\"sasid-close\",\"data\":\"%s\"}}}}}", rementr[ i ]->authid, as->sas_SASID,  loggedSession->us_User->u_Name, rementr[ i ]->usersession->us_User->u_Name );
    			msgsndsize += WebSocketSendMessageInt( rementr[ i ]->usersession, tmp, len );
    		
    			SASSessionRemUserSession( as, rementr[ i ]->usersession );
    		}
    	}
    	FFree( rementr );
    }
    */

    /**
	* 
	* <HR><H2>system.library/app/send</H2>Send message to other users (not owner of sas)
	*
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) application id
	* @param sasid - (required ) shared session id
	* @param usernames - users to which we want to send message. Function expect user names separated by comma
	* @param msg - (required) message which we want to send to users

	* @return {response:success}, when success, otherwise error code
	*/

    send(con, requestid, authid, sasid, usernames, msg) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[send]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);

                console.log("[send]: " + sasid + " sasfromlist " + sasFromList + " usernames " + usernames);

                if (sasFromList != null) {
                    if (usernames == null) {
                        for (var session in sasFromList.getSessionlist().values()) {
                            console.log("[send]: (all): trying to send message to session " + session.getUsername());
                            session.sendMessage(msg);
                        }
                    } else {
                        var arrayOfNames = usernames.split(",");
                        console.log("[send]: going to send message to " + usernames + " array of names length " + arrayOfNames.length + " values " + sasFromList.getSessionlist().values());
                        for (let session of sasFromList.getSessionlist().values()) {
                            console.log("[send]: trying to send message to session " + session.getUsername());
                            for (let uname of arrayOfNames) {
                                console.log("[send]: trying to send message to " + uname);
                                if (session.getUsername() == uname) {
                                    console.log("[send]: sending message: " + msg + " to user " + uname);
                                    session.sendMessage(msg);
                                }
                            }
                        }
                    }
                }

                con.sendUTF("{'response':'success'}");
            }
        }); // get user session
    }


    /*
    	if( assid != NULL && msg != NULL )
    	{
    		char *end;
    		FUQUAD asval = strtoull( assid,  &end, 0 );
    		SASSession *as = SASManagerGetSession( l->sl_SASManager, asval );
    		
    		if( as != NULL )
    		{
    			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
    			{
    				loggedSession->us_InUseCounter++;
    				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
    			}
    			
    			int err = 0;
    			if( as->sas_Type == SAS_TYPE_OPEN )
    			{
    				err = SASSessionSendMessage( as, loggedSession, msg, strlen( msg ), NULL );
    			}
    			else
    			{
    				err = SASSessionSendMessage( as, loggedSession, msg, strlen( msg ), usernames );
    			}
    			if( err > 0 )
    			{
    				int size = sprintf( buffer, "{\"response\":\"success\"}" );
    				HttpAddTextContent( response, buffer );
    			}
    			else
    			{
    				char dictmsgbuf[ 256 ];
    				char dictmsgbuf1[ 196 ];
    				snprintf( dictmsgbuf1, sizeof(dictmsgbuf1), l->sl_Dictionary->d_Msg[DICT_CANNOT_SEND_MSG_ERR], err );
    				snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", dictmsgbuf1 , DICT_CANNOT_SEND_MSG_ERR );
    				HttpAddTextContent( response, dictmsgbuf );
    			}
    			
    			if( as->sas_Obsolete == TRUE )
    			{
    				int err = SASManagerRemSession( l->sl_SASManager, as );
    			}
    			
    			if( FRIEND_MUTEX_LOCK( &loggedSession->us_Mutex ) == 0 )
    			{
    				loggedSession->us_InUseCounter--;
    				FRIEND_MUTEX_UNLOCK( &loggedSession->us_Mutex );
    			}
    		}
    		else
    		{
    			char dictmsgbuf[ 256 ];
    			snprintf( dictmsgbuf, sizeof(dictmsgbuf), "{\"response\":\"%s\",\"code\":\"%d\"}", l->sl_Dictionary->d_Msg[DICT_SASID_NOT_FOUND] , DICT_SASID_NOT_FOUND );
    			HttpAddTextContent( response, dictmsgbuf );
    		}
    	}
    */

    /**
	* 
	* <HR><H2>system.library/app/sendowner</H2>Send message to SAS owner
	*
	* @param con - (required) websocket connection
	* @param requestid - id of request
	* @param authid - (required) application id
	* @param sasid - (required ) shared session id
	* @param msg - (required) message which we will be send

	* @return {response:success}, when success, otherwise error code
    */


    sendowner(con, requestid, authid, sasid, msg) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[sendowner]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);

                console.log("[sendowner] " + sasid + " sasfromlist " + sasFromList);

                if (sasFromList != null) {
                    if (sasFromList.getSessionOwner() != null) {
                        sasFromList.getSessionOwner().sendMessage(msg);
                    } else {
                        console.log("[sendowner] Cannot send message there is no owner or his connection is broken");
                    }
                }

                con.sendUTF("{'response':'success'}");
            }
        }); // get user session
    }


    /**
     * 
     * <HR><H2>system.library/app/takeover</H2>Take over other user SAS session
     *
     * @param sessionid - (required) session id of logged user
     * @param sasid - (required ) shared session id
     * @param username - (required) user name which will take over of SAS
     * @return {response:success}, when success, otherwise error code
     */

    // WE DONt NEED IT, ITS NOT IN USE

    /**
	* 
	* <HR><H2>system.library/app/switchsession</H2>Switch user SAS session
	*
	* @param sessionid - (required) session id of logged user
	* @param sasid - (required ) shared session id
	* @param deviceid - (required) deviceid of user device to which user want to switch in SAS

	* @return {response:success}, when success, otherwise error code
    */

    // WE DONt NEED IT, ITS NOT IN USE

    /**
     * 
     * <HR><H2>system.library/app/putvar</H2>Put variable into Application Session
     *
     * @param con - (required) websocket connection
     * @param requestid - id of request
     * @param authid - (required) authentication id of application
     * @param sasid - (required ) shared session id
     * @param val - (required) variable which will be stored in SAS
     * @param valid - variable ID, if not provided new will be created. Otherwise updated
     * @param mode - set to "private" if you want to have private variable. Otherwise it will be public
     * @return {VariableNumber:<number>}, when number > 0 then variable was created/updated. Otherwise error number will be returned
     */

    putvar(con, requestid, authid, sasid, val, valid, mode) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[putvar]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);
                if (sasFromList != null) {
                    console.log("[putvar]: sas found");
                    sasFromList.putVariable(valid, val);

                    con.sendUTF("{'VariableNumber':" + valid + "}");
                } else {
                    con.sendUTF("{'error':'SAS not found'}");
                }
            } else {
                con.sendUTF("{'error':'sasid parameter is missing'}");
            }
        }); // get user session
    }

    /**
     * 
     * <HR><H2>system.library/app/getvar</H2>Get variable from Application Session
     *
     * @param con - (required) websocket connection
     * @param requestid - id of request
     * @param authid - (required) auth id of application
     * @param sasid - (required ) shared session id
     * @param varid - variable ID from which data will be taken
     * @return {VariableData:<data>} when success, otherwise error with code
     */

    getvar(con, requestid, authid, sasid, valid) {
        var usersProm = Database.findUserSessionByAuthID(authid);

        console.log("[getvar]: " + usersProm);
        usersProm.then((resp) => {

            if (resp.length <= 0 || resp.ID == undefined) // response do not contain ID so it means that user was not found
            {
                con.sendUTF("{'response':'permission denied','code':''}");
                return;
            }

            if (sasid != null) {
                var sasFromList = getSAS(sasid);
                var retVal = null;

                console.log("[getvar] was sas found " + sasFromList + " for sasid " + sasid + " sasmape entries " + this.sasMap.length);

                if (sasFromList != null) {
                    retVal = sasFromList.getVariable(valid);
                    console.log("[getvar] " + valid + ' retVal ' + retVal);
                }

                if (retVal == null) {
                    con.sendUTF("{'VariableData': '' }");
                } else {
                    con.sendUTF("{'VariableData':'" + retVal + "'}");
                }
            } else {
                con.sendUTF("{'error':'SAS not found'}");
            }
        }); // get user session
    }

    /*
    * Get SAS from MAP
    * @return SAS if found or null
    */

    getSAS(sasid) {
        var ret = null;

        ret = this.sasMap.get(sasid);

        if (ret != null) {
            ret.updateTime(); // we want to update last usage time
        }

        return ret;
    }
    
    /*
    * Put SAS into map
    * @param newsas - new SAS session
    * @param id - id of new entry
    */
    
    putSAS( newsas, id )
    {
        this.sasMap.add(newsas, id); 
    } 
}
