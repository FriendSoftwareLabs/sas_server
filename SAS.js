
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

        this.varMap = new Map();        // variable map

        //us = new UserSession();
        //this.sessionList.add( us );
        console.log("SASID : " + this.ID + " - " + this.type );
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
        return this.varMap.get( val );
    }

    putVariable( val, string )
    {
        this.varMap[ val ] = string;
    }

    //
    // Add new entry to list
    //

    addUserSession( key, username, userid, connection, isAccepted, isAdmin )
    {
        let sa = new UserSession( username, userid, connection, isAdmin, isAccepted );
        this.sessionList.add( sa, key );
        if( this.sessionList.length == 1 )  // first session means its owner
        {
            this.sessionOwner = sa;
        }
        console.log("SAS user session added: " + username );
    }

    //
    // Get entry from list
    //

    getUserSession( key )
    {
        return this.sessionList.get( key );
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
}
