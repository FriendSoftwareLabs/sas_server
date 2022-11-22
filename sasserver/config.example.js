
server = {
    type:"configuration",
    data:
    {
        websockets:
        {
            port:1337,
			secured:true,
			sslCertPath:"../../cfg/crt/certificate.pem",
			sslKeyPath:"../../cfg/crt/key.pem"
        },
        database:
        {
            host: "215.148.12.51",
            user:"root",
            password:"root",
            name: "FriendMaster"
        },
        ip : "215.148.12.3"
    }
};

module.exports = server;
