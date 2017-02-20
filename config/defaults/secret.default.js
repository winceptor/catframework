module.exports={	
	//SERVER
	server_port: 80,
	server_sslport: 443,

	//DATABASE
	db_database: 'mongodb://localhost:27017/localdatabase',
	db_secretkey: "localdatabase",
	
	//EMAIL
	email_host: 'localhost',
    email_port: 465,
	email_secure: true, // use SSL
	email_user: 'user@email.com',
    email_pass: 'password',
	email_sender: 'Administrator',
	
	//CAPTCHA
	captcha_api: 'https://www.google.com/recaptcha/api/siteverify',
	captcha_sitekey: '',
	captcha_secretkey: ''
}
