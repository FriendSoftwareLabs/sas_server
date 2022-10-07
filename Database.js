

//
//
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
  
    //
	  // Find users by sessionid
	  //

	  static findUserSessionBySessionID(sessionid ) {
        return new Promise(async (resolve) => {
          console.log('findUserSessionBySessionID '+ sessionid );
          try
          {
              let sql;
              sql = 'SELECT u.* FROM FUser u inner join FUserSession us on u.ID=us.UserID WHERE us.SessionID=\''+sessionid +'\' limit 1;';
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
            sql = 'SELECT us.SessionID,cn.Address FROM `FUserSession` us inner join FClusterNode cn on us.FCID=cn.FCID inner join FUser u on us.UserID=u.ID where u.Name in ('+ users +') group by cn.Address';
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

              data.forEach(function (item, index) {
                
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
