const mongoose = require("mongoose");
require("dotenv").config();

// Workaround for a Node.js + Windows bug where mongodb+srv:// DNS SRV lookups
// fail with "querySrv ECONNREFUSED" because Node doesn't correctly use the
// system DNS resolver. Forcing public resolvers fixes it. Harmless on
// non-Windows platforms (e.g. Render deployment).
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const { MONGODB_URL } = process.env;

exports.connect = () => {
	mongoose
		.connect(MONGODB_URL, {
			useNewUrlparser: true,
			useUnifiedTopology: true,
		})
		.then(() => console.log(`DB Connection Success`))
		.catch((err) => {
			console.log(`DB Connection Failed`);
			console.log(err);
			process.exit(1);
		});
};