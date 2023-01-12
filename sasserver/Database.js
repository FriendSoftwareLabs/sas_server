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
// Database class
//

const { getSystemErrorMap } = require("util");

var database;

module.exports = class Database
{
    // linkedlist class 
	constructor( db ) 
	{ 
		database = db;
	} 

  /*
 CREATE TABLE IF NOT EXISTS `FSASServer` (
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`IP` varchar(64) NOT NULL,
	`UID` varchar(256) NOT NULL,
	`Status` smallint(2) DEFAULT NULL,
	`Sessions` bigint(20) NOT NULL,
	PRIMARY KEY (`ID`) , UNIQUE( `UID` )
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `FSASSession` (
	`ID` bigint(20) NOT NULL AUTO_INCREMENT,
	`ServerID` bigint(20) NOT NULL,
	`CreationTime` bigint(32) NOT NULL,
	PRIMARY KEY (`ID`) 
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1;

  */

    //
    // Generate tables in DB
    //

     static createServer( id, ip )
     {
      console.log('checkAndGenerateDBTables: ' );
        new Promise(async (resolve) => {
          console.log('checkAndGenerateDBTables 1');
          try
          {
            let sql;
              
            sql = "CREATE TABLE IF NOT EXISTS `FSASServer` ( \
              `ID` bigint(20) NOT NULL AUTO_INCREMENT, \
              `IP` varchar(64) NOT NULL, \
              `Status` smallint(2) DEFAULT NULL,  \
              `Sessions` bigint(20) NOT NULL, \
              PRIMARY KEY (`ID`) \
             ) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=latin1";

            const data = await database.query(sql, []);

            console.log('checkAndGenerateDBTables: Looking for Data: sql: ' + sql );

            var retData = [];
            var i = 0;

          //return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          //return resolve(null);
        }
      });

      //
      // Insert current server into DB
      //

      new Promise(async (resolve) => {
        console.log('checkAndGenerateDBTables 1');
        try
        {
          let sql;

          //
          // UID is unique so entry cannot be in DB twice
          //
            
          sql = "INSERT INTO `FSASServer` (`ID`, `IP`, `UID`, `Status`, `Sessions`) VALUES (NULL, '"+ ip +"','"+ id +"', 1, 0)";

	  console.log('Insert SQL: ' + sql );

          const data = await database.query(sql, []);

          console.log('checkAndGenerateDBTables: Looking for Data: sql: ' + sql );

          var retData = [];
          var i = 0;

        //return resolve(retData);	// data
      }
      catch (err) 
      {
        console.error("SQL call: " + err);
        //return resolve(null);
      }
    });
     }

     //
	 // Update Sessions
	 //

	 static updateSessionsInSASServer( id, add ) 
     {
      return new Promise(async (resolve) => 
      {
        console.log('updateSessionsInSASServer '+ id );
        try
        {
          let sql = "";

          if( add == true )
          {
            sql = "UPDATE FSASServer SET Sessions = Sessions + 1 WHERE UID='" + id +"';" ;
          }
          else
          {
            sql = "UPDATE FSASServer SET Sessions = Sessions - 1 WHERE UID='" + id +"';" ;
          }
          //sql += ' us.SessionID= ? limit 1';
          //console.log('Looking for Data : ' + database );
          const data = await database.query(sql);
          const maxEntries = data.length - 1;

          console.log('updateSessionsInSASServer: ' + data);

          var retData = [{}];

          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
    }
    
    //
	 // Remove old SAS Sessions
	 //

	 static removeOldSASS( saslist ) 
     {
      return new Promise(async (resolve) => 
      {
        console.log('removeOldSASS '+ id );
        try
        {
          let sql = "";

          sql = "DELETE from FSASSession WHERE ID in('" + saslist +"');" ;

          //sql += ' us.SessionID= ? limit 1';
          //console.log('Looking for Data : ' + database );
          const data = await database.query(sql);
          const maxEntries = data.length - 1;

          console.log('removeOldSASS: ' + data);

          var retData = [{}];

          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
    }
    
    //
	// Find users by authid
	//

	static findUserSessionByAuthID(sessionid ) 
    {
      return new Promise(async (resolve) => 
      {
        console.log('findUserSessionByAuthID '+ sessionid );
        try
        {
          let sql;
          sql = 'SELECT u.* FROM FUserApplication a, FUserSession us, FUser u WHERE a.UserID = us.UserID AND a.UserID = u.ID AND a.AuthID=\"%s\" LIMIT 1'
          //sql = 'SELECT u.* FROM FUser u inner join FUserSession us on u.ID=us.UserID WHERE us.SessionID=\''+sessionid +'\' limit 1;';
          //sql += ' us.SessionID= ? limit 1';
          //console.log('Looking for Data : ' + database );
          const data = await database.query(sql);
          const maxEntries = data.length - 1;

          console.log('findUserSessionByAuthID: ' + data);

          var retData = [{}];

          data.forEach(function (item, index) 
          {
            if( index < maxEntries )
            {
              //console.log('row ' + JSON.stringify(item) + ' index ' + JSON.stringify(index) + ' last ' + maxEntries );
              retData[ index ] =  JSON.stringify(item);
              //item.forEach(function (litem, lindex) {
              //    retData[ lindex ] =  JSON.stringify(litem);
              //    console.log('in table: ' + JSON.stringify(retData[ lindex ]) );
              //console.log('row ' + JSON.stringify(litem), JSON.stringify(lindex) );
              //  });
            }
          });
          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
    }
  
    //
	// Find users by sessionid
	//

	static findUserSessionBySessionID1(sessionid ) 
    {
      return new Promise(async (resolve) => 
      {
        console.log('findUserSessionBySessionID '+ sessionid );
        try
        {
          let sql;
          sql = 'SELECT u.* FROM FUserApplication a, FUserSession us, FUser u WHERE a.UserID = us.UserID AND a.UserID = u.ID AND a.AuthID=\"%s\" LIMIT 1'
          //sql = 'SELECT u.* FROM FUser u inner join FUserSession us on u.ID=us.UserID WHERE us.SessionID=\''+sessionid +'\' limit 1;';
          //sql += ' us.SessionID= ? limit 1';
          //console.log('Looking for Data : ' + database );
          const data = await database.query(sql);
          const maxEntries = data.length - 1;

          console.log('findUserSessionBySessionID: ' + data);

          var retData = [{}];

          data.forEach(function (item, index) 
          {
            if( index < maxEntries )
            {
              //console.log('row ' + JSON.stringify(item) + ' index ' + JSON.stringify(index) + ' last ' + maxEntries );
              retData[ index ] =  JSON.stringify(item);
              //item.forEach(function (litem, lindex) {
              //    retData[ lindex ] =  JSON.stringify(litem);
              //    console.log('in table: ' + JSON.stringify(retData[ lindex ]) );
              //console.log('row ' + JSON.stringify(litem), JSON.stringify(lindex) );
              //  });
            }
          });
          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
    }

    //
    // Find sessions and servers to which they belongs
    //

    static findServersAndSessionsBySessionID( userlist ) {
      return new Promise(async (resolve) => {
        console.log('findServersAndSessionsBySessionID');
        try
        {
          var users = "'" + userlist.split( "," ).join( "','" ) + "'";
            let sql;
            sql = 'SELECT us.SessionID,cn.Address FROM `FUserSession` us inner join FClusterNode cn on us.FCID=cn.FCID inner join FUser u on us.UserID=u.ID where u.Name in ('+ users +')';// group by cn.Address';
            // AND DeviceIdentity != 'tempsession'
            console.log('Looking for Data : ' + database );
            const data = await database.query(sql);
            const maxEntries = data.length - 1;

            console.log('findServersAndSessionsBySessionID: ' + data);

            var retData = [{}];

            data.forEach(function (item, index) 
            {
              console.log('row ' + JSON.stringify(item), JSON.stringify(index) );
              if( index < maxEntries )
              {
                //console.log('row ' + JSON.stringify(item) + ' index ' + JSON.stringify(index) + ' last ' + maxEntries );
                retData[ index ] = item;// JSON.stringify(item);
              }
            });
          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
  }

    //
    // Find users by authid
    //

    static findUserSessionByAuthID( authid ) {
      console.log('findUserSessionByAuthID: passing parameter: ' + authid );
        return new Promise(async (resolve) => {
          console.log('findUserSessionByAuthID');
          try
          {
            let sql;
              
            sql = "SELECT fu.* FROM FUser fu inner join FUserApplication ua on fu.ID=ua.UserID WHERE ua.AuthID='"+authid+"'";
            //const data = await database.query(sql, [`${authid}%`]);
            //sql = 'SELECT * FROM FUser';
            const data = await database.query(sql, []);

            console.log('findUserSessionByAuthID: Looking for Data: ' + authid + ' sql: ' + sql );
            //console.log('findUserSessionByAuthID: ' + data);

            var retData = [];
            var i = 0;

            data.forEach(function (item, index) 
            {
              //console.log('row ' + JSON.stringify(item), JSON.stringify(index) );
              item.forEach(function (litem, lindex) {
              if( 'UniqueID' in litem )   // we are checking if structure have UniqueID field
              {
                // we want object not json
                retData[ i ] = litem;// JSON.stringify(litem);
                console.log('findUserSessionByAuthID: object > ' + JSON.stringify( litem ) );
                i++;
              }
              else
              {
                //console.log('findUserSessionByAuthID: bad object > ' + JSON.stringify(retData[ lindex ]) );
              }
            });
          });

          return resolve(retData);	// data
        }
        catch (err) 
        {
          console.error(err);
          return resolve(null);
        }
      });
    }
} 
