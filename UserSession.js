
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

    //
    // Get username to which session is attached
    //

    getUsername()
    {
        return this.username;
    }

    //
    // Get sessionid string
    //

    getSessionid()
    {
        return this.sessionid;
    }

    //
    // Get UserID
    //

    getUserID()
    {
        return this.userID;
    }

    //
    // Get WebSocket connection
    //

    getConnection()
    {
        return this.wsConnection;
    }

    //
    // Is session accepted
    //

    isAccepted()
    {
        return this._isAccepted;
    }

    //
    // is Admin session
    //

    isAdmin()
    {
        return this._isAdmin;
    }

    //
    // Set if session is accepted by admin
    //

    setAccepted( isAccepted )
    {
        this.isAccepted = isAccepted;
    }

    //
    // Send message to UserSession via WebSockets
    //

    sendMessage( msg )
    {
        if( this.wsConnection != null )
        {
            this.wsConnection.sendUTF( msg );
        }
    }
}
