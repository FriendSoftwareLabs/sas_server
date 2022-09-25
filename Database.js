

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
	  //
	  //

	  static findUserSessionBySessionID(sessionid ) {
        return new Promise(async (resolve) => {
          console.log('findUserSessionBySessionID');
          try
      {
              let sql;
              sql = 'SELECT * FROM FUser';// WHERE ';
              //sql += 'SessionID= ?';
              console.log('Looking for Data : ' + database );
              const data = await database.query(sql, [`${sessionid}%`]);

              console.log('findUserSessionBySessionID: ' + data);

              var retData = [{}];

              data.forEach(function (item, index) {
                  //console.log('row ' + JSON.stringify(item), JSON.stringify(index) );
                  item.forEach(function (litem, lindex) {
                      retData[ lindex ] =  JSON.stringify(litem);
                      console.log('in table: ' + JSON.stringify(retData[ lindex ]) );
                      //console.log('row ' + JSON.stringify(litem), JSON.stringify(lindex) );
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

  //
    //
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
