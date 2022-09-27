/*

*/

const https = require('https');
const querystring = require('querystring');
const qs = require('qs');


//
// Class which is able to call FriendCore
//

module.exports = class Friendos 
{
    constructor( url ) 
    {
        this.url = url;
    }

    sendRequest( pathparam, params, callback )
    {
        let bodyData = qs.stringify( params );

        const options = {
            hostname: this.url,
            path: pathparam,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
        
            console.log('Status Code:', res.statusCode);
        
            res.on('data', (chunk) => {
                data += chunk;
            });
        
            res.on('end', () => {
                console.log('Body: ', JSON.parse(data));
                callback( data );
            });
        
        }).on("error", (err) => {
            console.log("Error: ", err.message);
        });
        
        req.write(data);
        req.end();
    }
} 