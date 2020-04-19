/* Magic Mirror
 * Module: MMM-AdGuard-Home
 * By Ricardo Gonzalez
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var request = require("request");

module.exports = NodeHelper.create({
	start: function () {
		console.log("MMM-AdGuard-Home helper started ...");
	},
	/* getAdGuardHomeStats()
   * Requests new data from AdGuard Home API.
   * Sends data back via socket on succesfull response.
   */
	getAdGuardHomeStats: function (url, token) {
		var self = this;

		request(
			{
				url: url,
				method: "GET",
				headers: {
					Authorization: "Basic " + token
				},
			},
			function (error, response, body) {
				// Lets convert the body into JSON
				var result = JSON.parse(body);
				if (!error && response.statusCode == 200) {
					if (result.status == "error") {
						self.sendSocketNotification("SEND_ADGUARDHOME_STATS_DATA", {
							data: null,
							url: url,
						});
					} else {
						self.sendSocketNotification("SEND_ADGUARDHOME_STATS_DATA", {
							data: result,
							url: url,
						});
					}
				} else {
					self.sendSocketNotification("SEND_ADGUARDHOME_STATS_DATA", {
						data: null,
						url: url,
					});
				}
			}
		);
	},
	//Subclass socketNotificationReceived received.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "GET_ADGUARDHOME_STATS_DATA") {
			this.getAdGuardHomeStats(payload.url, payload.token);
		}
	},
});
