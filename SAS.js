
const List = require('./_list.js');
const Map = require('./map.js');
const UserSession = require('./UserSession.js');

//
// SAS object
//

module.exports = class SAS 
{
    constructor( con, id, type, appname ) 
    {
        this.wsConnection = con;        // SAS WebSocket connection
        this.ID = id;                   // SAS ID
        this.type = type;               // SAS type
        this.sessionList = new Map();   // list of sessions in SAS
        this.sessionOwner = null;       // session owner
        this.appname = appname;         // application name
        this.invitedUsers = [];         // inviated users

        this.varMap = new Map();        // variable map

        //us = new UserSession();
        //this.sessionList.add( us );
        console.log("Create SAS : SASID : " + this.ID + " - " + this.type );
    }

    getID()
    {
        return this.ID;
    }

    getWSConnection()
    {
        return this.wsConnection;
    }

    getType()
    {
        return this.type;
    }

    getSessionOwner()
    {
        return this.sessionOwner;
    }

    getAppname()
    {
        return this.appname;
    }

    getVariableMap()
    {
        return this.varMap;
    }

    getVariable( val )
    {
        console.log('SAS get variable key: ' + val + ' size ' + this.varMap.length );
        return this.varMap.get( val );
    }

    putVariable( val, string )
    {
        this.varMap.add( string, val );
    }

    setInvatedUsers( users )
    {
        this.invitedUsers = users;
    }

    addInvatedUsers( user )
    {
        this.invitedUsers.push( user );
    }

    //
    // Add new entry to list
    //

    addUserSession( sessionid, username, userid, connection, isAccepted, isAdmin )
    {
        let access = false;

        if( this.type == 'open' )
        {
            access = true;
        }
        else
        {
            for( let lusr of this.invitedUsers )
            {
                if( lusr == username )
                {
                    access = true;
                    break;
                }
            }
        }

        if( access == true )
        {
            var sa = new UserSession( sessionid, username, userid, connection, isAdmin, isAccepted );
            console.log("addUserSession: session user name: " + sa.getUsername() );
            this.sessionList.add( sa, sessionid );

            if( this.sessionList.length == 1 )  // first session means its owner
            {
                this.sessionOwner = sa;
                console.log("addUserSesssion owner set");
            } 
            console.log("SAS user session added: " + sa.getUsername() );
        }
        else
        {
            console.log("SAS user session was not added (no access/invitation): " + username );
        }
    }

    //
    // Get entry from list
    //

    getUserSession( sessionid )
    {
        return this.sessionList.get( sessionid );
    }

    //
    // Get number of connections in list
    //

    getConnectionNumber()
    {
        return this.sessionList.length;
    }

    //
    // Remove entry
    //

    removeUserSession( key )
    {
        this.sessionList.remove( key );
    }

    //
    // Remove entry by user name
    //

    removeUserSessionByUsername( uname )
    {
        for (var session in sasFromList.sessionList.values() )
        {
            if( session.getUsername() == uname )
            {
                this.sessionList.remove( session.getSessionid() );
            }
        }
    }

    //
    // Get session list
    //

    getSessionlist()
    {
        return this.sessionList;
    }
}
