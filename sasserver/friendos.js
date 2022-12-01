/*©mit**************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the MIT License, *
* found in the file license_mit.txt.                                           *
*                                                                              *
*****************************************************************************©*/

const https = require('https');
const querystring = require('querystring');
//const qs = require('qs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

//
// Class which is able to call FriendCore
//

module.exports = class Friendos 
{
    constructor( url ) 
    {
        this.url = url;
    }

    sendRequest( pathparam, bodyData, callback )
    {
        //let bodyData = JSON.stringify(params);
        //let bodyData = querystring.stringify( params );
        let data = '';
        
        console.log("sendRequest: pathparam " + pathparam + " bodyData " + bodyData );

        const options = {
            hostname: this.url,
            port: 6502,
            path: pathparam,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': bodyData.length
            }
        };

        const req = https.request(options, (res) => {

            console.log('Status Code:', res.statusCode);
        
            res.on('data', (chunk) => {
                data += chunk;
            });
        
            res.on('end', () => {
                if( data.startsWith('fail<!--separate-->') )
                {
                    console.log("FriendOS call fail: " + data );
                }
                else
                {
                    try{
                        console.log("FriendOS call ok: " + data );
                        data = data.replace( 'ok<!--separate-->','' );
                        console.log('Body: ', JSON.parse(data));
                    }
                    catch(e){}
                }
                
                if( callback != null )
                {
                    callback( data );
                }
            });
        
        }).on("error", (err) => {
            console.log("Error: ", err.message);
        });
        
        req.write(bodyData);
        req.end();
    }
} 
