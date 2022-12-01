/*©lgpl**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the LGPL License, *
* found in the file license_lgpl.txt.                                           *
*                                                                              *
*****************************************************************************©*/

const List = require('./_list.js');
const Map = require('./map.js');
const UserSession = require('./UserSession.js');

//
// SAS object
//

module.exports = class SAS {
    constructor(con, id, type, appname) {
        this.wsConnection = con; // SAS WebSocket connection
        this.ID = id; // SAS ID
        this.type = type; // SAS type
        this.sessionList = new Map(); // list of sessions in SAS
        this.sessionOwner = null; // session owner
        this.appname = appname; // application name
        this.invitedUsers = []; // inviated users
        this.timeCreate = Math.floor(Date.now() / 1000); // creation time
        this.timeLastUsed = this.timeCreate; // last use time

        this.varMap = new Map(); // variable map

        console.log("Create SAS : SASID : " + this.ID + " - " + this.type);
    }

    //
    // Get SAS ID
    //

    getID() {
        return this.ID;
    }

    //
    // Get SAS WebSocket Connection
    //

    getWSConnection() {
        return this.wsConnection;
    }

    //
    // Get type of SAS. open or closed
    //

    getType() {
        return this.type;
    }

    //
    // Get Session Owner (Session structure)
    //

    getSessionOwner() {
        return this.sessionOwner;
    }

    //
    // Get Application Name assigned to SAS
    //

    getAppname() {
        return this.appname;
    }

    //
    // Get variable list
    //

    getVariableMap() {
        return this.varMap;
    }

    //
    // Get SAS variable by key
    //

    getVariable(val) {
        console.log('SAS get variable key: ' + val + ' size ' + this.varMap.length);
        return this.varMap.get(val);
    }

    //
    // Put SAS variable into map
    //

    putVariable(val, string) {
        this.varMap.add(string, val);
    }

    //
    // Set Invited users
    // If user is invated (name) then he is allowed to join SAS
    //

    setInvatedUsers(users) {
        this.invitedUsers = users;
    }

    //
    // Add user to user list which have access to SAS
    //

    addInvatedUsers(user) {
        this.invitedUsers.push(user);
    }

    //
    // Add new entry to list
    //

    addUserSession(sessionid, username, userid, connection, isAccepted, isAdmin) {
        let access = false;

        if (this.type == 'open') {
            access = true;
        } else {
            for (let lusr of this.invitedUsers) {
                if (lusr == username) {
                    access = true;
                    break;
                }
            }
        }

        if (access == true) {
            var sa = new UserSession(sessionid, username, userid, connection, isAdmin, isAccepted);
            console.log("addUserSession: session user name: " + sa.getUsername());
            this.sessionList.add(sa, sessionid);

            if (this.sessionList.length == 1) // first session means its owner
            {
                this.sessionOwner = sa;
                console.log("addUserSesssion owner set");
            }
            console.log("SAS user session added: " + sa.getUsername());
        } else {
            console.log("SAS user session was not added (no access/invitation): " + username);
        }
    }

    //
    // Get entry from list
    //

    getUserSession(sessionid) {
        return this.sessionList.get(sessionid);
    }

    //
    // Get number of connections in list
    //

    getConnectionNumber() {
        return this.sessionList.length;
    }

    //
    // Get creation time
    //

    getCreationTime() {
        return this.timeCreate;
    }

    //
    // Update time when SAS was used
    //

    updateTime() {
        this.timeLastUsed = Math.floor(Date.now() / 1000);
    }

    //
    // Remove entry
    //

    removeUserSession(key) {
        this.sessionList.remove(key);
    }

    //
    // Remove entry by user name
    //

    removeUserSessionByUsername(uname) {
        for (var session in sasFromList.sessionList.values()) {
            if (session.getUsername() == uname) {
                this.sessionList.remove(session.getSessionid());
            }
        }
    }

    //
    // Get session list
    //

    getSessionlist() {
        return this.sessionList;
    }
}
