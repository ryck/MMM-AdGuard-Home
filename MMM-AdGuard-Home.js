/* Magic Mirror Module: MMM-AdGuard-Home
 * By Ricardo Gonzalez https://github.com/ryck/MMM-AdGuard-Home
 * MIT Licensed.
 */
Module.register("MMM-AdGuard-Home", {
	defaults: {
		api: "",
		token: "",
		updateInterval: 1 * 60 * 1000, // Every minute hour.
		initialLoadDelay: 0, // No delay.
		animationSpeed: 1000, // One second.
		debug: false

	},
	start: function () {
		Log.info("Starting module: " + this.name);
		this.loaded = false;
		this.result = null;
		this.scheduleUpdate(this.config.initialLoadDelay);
		this.updateTimer = null;
		this.apiBase = "http://" + this.config.api + "/control/stats";
		this.url = encodeURI(this.apiBase);
		if (this.config.debug) {
			Log.info(this.url);
		}
		this.updateAdGuardHome(this);
	},
	// updateAdGuardHome
	updateAdGuardHome: function (self) {
		self.sendSocketNotification("GET_ADGUARDHOME_STATS_DATA", { "url": self.url, "token": self.config.token });
	},

	getStyles: function () {
		return ["MMM-AdGuard-Home.css"];
	},
	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},
	//Define header for module.
	getHeader: function () {
		return this.data.header;
	},

	// Override dom generator.
	getDom: function () {
		var wrapper = document.createElement("div");

		if (this.config.api === "") {
			wrapper.innerHTML = "Please set the API.";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
		if (this.config.token === "") {
			wrapper.innerHTML = "Please set the token.";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "Loading...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		{/* <div>
  <div class="ui three statistics">
    <div class="ui statistic">
      <div class="value">22</div>
      <div class="label">Faves</div>
    </div>
    <div class="ui statistic">
      <div class="value">31,200</div>
      <div class="label">Views</div>
    </div>
    <div class="ui statistic">
      <div class="value">22</div>
      <div class="label">Members</div>
    </div>
  </div>
</div> */}

		if (this.result.data != null) {
			var num_dns_queries = this.result.data.num_dns_queries;
			var num_blocked_filtering = this.result.data.num_blocked_filtering;
			var percentage = num_blocked_filtering / num_dns_queries * 100;
			// Start building the UI.
			var statsWrapper = document.createElement("div");
			statsWrapper.className = "ui inverted statistics tiny xsmall";

			var queriesStatsBlock = document.createElement("div");
			queriesStatsBlock.className = "inverted green statistic";
			var queriesStatsValue = document.createElement("div");
			queriesStatsValue.className = "value";
			queriesStatsValue.innerHTML = num_dns_queries;
			var queriesStatsLabel = document.createElement("div");
			queriesStatsLabel.className = "label";
			queriesStatsLabel.innerHTML = "Queries";
			queriesStatsBlock.appendChild(queriesStatsValue);
			queriesStatsBlock.appendChild(queriesStatsLabel);

			var blockedStatsBlock = document.createElement("div");
			blockedStatsBlock.className = "inverted red statistic";
			var blockedStatsValue = document.createElement("div");
			blockedStatsValue.className = "value";
			blockedStatsValue.innerHTML = `${num_blocked_filtering}`;
			var blockedStatsLabel = document.createElement("div");
			blockedStatsLabel.className = "label";
			blockedStatsLabel.innerHTML = "Blocked";
			blockedStatsBlock.appendChild(blockedStatsValue);
			blockedStatsBlock.appendChild(blockedStatsLabel);

			statsWrapper.appendChild(queriesStatsBlock);
			statsWrapper.appendChild(blockedStatsBlock);
			wrapper.appendChild(statsWrapper);
		} else {
			var message = document.createElement("div");
			message.innerHTML = this.result.message;
			message.className = "bright small";
			wrapper.appendChild(message);

			var time = document.createElement("div");
			time.innerHTML = this.result.timestamp;
			time.className = "bright xsmall";
			wrapper.appendChild(time);
		}
		return wrapper;
	},
	processAdGuardHome: function (result) {
		this.result = {};
		this.result.timestamp = moment().format("LLL");
		if (typeof result !== "undefined" && result != null) {
			if (this.config.debug) {
				Log.info(result);
			}
			this.result.data = result;
		} else {
			//No data returned - set error message
			this.result.message = "No data returned";
			this.result.data = null;
			if (this.config.debug) {
				Log.error("No data returned");
				Log.error(this.result);
			}
		}
		this.updateDom(this.config.animationSpeed);
		this.loaded = true;
	},
	/* scheduleUpdate()
	 * Schedule next update.
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function (delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.updateAdGuardHome(self);
		}, nextLoad);
	},
	// Process data returned
	socketNotificationReceived: function (notification, payload) {
		if (notification === "SEND_ADGUARDHOME_STATS_DATA" && payload.url === this.url) {
			if (this.config.debug) {
				Log.info(payload.data);
			}
			this.processAdGuardHome(payload.data);
			this.scheduleUpdate(this.config.updateInterval);
		}
	}
});
