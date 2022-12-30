
server = {
    type:'configuration',
    data:
    {
        websockets:
        {
		port:6505,
		secured:true,
		sslCertPath:"certificate.pem",
		sslKeyPath:"key.pem"
        },
        database:
        {
            host: 'localhost',
            user:'friendup',
            password:'friendup1',
            name: 'friendup'
        },
        ip : '185.116.4.178'
    }
};

module.exports = server;

