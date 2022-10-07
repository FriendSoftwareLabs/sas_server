
//
// User session object
//

module.exports = class UserSession 
{
    constructor( sessionid, username, userID, con, isAdmin, isAccepted ) 
    {
        this.sessionid = sessionid;
        this.username = username;
        this.userID = userID;
        this.wsConnection = con;
        this._isAdmin = isAdmin;
        this._isAccepted = isAccepted;
        console.log("Authid : " + this.authid + " USersession " + this.sessionid );
    }

    getUsername()
    {
        return this.username;
    }

    getSessionid()
    {
        return this.sessionid;
    }

    getUserID()
    {
        return this.userID;
    }

    getConnection()
    {
        return this.wsConnection;
    }

    isAccepted()
    {
        return this._isAccepted;
    }

    isAdmin()
    {
        return this._isAdmin;
    }

    setAccepted( isAccepted )
    {
        this.isAccepted = isAccepted;
    }

    sendMessage( msg )
    {
        this.wsConnection.sendUTF( msg );
    }
}
