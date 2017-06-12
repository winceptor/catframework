module.exports = {
	//appname
	appname: "nodeapp",

	//developer
	wip: true,

	//respawn module mailer
	notify_crashes: false,
	notify_email: "admin@emailhost",
	notify_name: "admin",

	//default timezone
	gmt_offset: 0,

	//give localhost admin rights always
	localhostadmin: false,
	//give admin rights to anyone when there is 0 admin users
	zeroadmins_unrestricted: false,

	language_translator: true,
	language_default: 'english',
	language_choices: ["english", "finnish"],

	log_filename: 'server.log'
}
