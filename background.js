var toReload = null;

function reloadExtensions() {

	// find all unpacked extensions and reload them
	chrome.management.getAll(function (a) {
		var ext = {};
		for (var i = 0; i < a.length; i++) {
			ext = a[i];
			if ((ext.installType === "development") &&
				(ext.enabled === true) &&
				(ext.name !== "Extensions Reloader")) {
				console.log(ext.name + " reloaded");
				(function (extensionId, extensionType) {
					// disable
					chrome.management.setEnabled(extensionId, false, function () {
						// re-enable
						chrome.management.setEnabled(extensionId, true, function () {
							// re-launch packaged app
							if (extensionType === "packaged_app") {
								chrome.management.launchApp(extensionId);
							}
						});
					});
				})(ext.id, ext.type);
			}
		}
	});

	// show an "OK" badge
	chrome.browserAction.setBadgeText({ text: "OK" });
	chrome.browserAction.setBadgeBackgroundColor({ color: "#4cb749" });
	setTimeout(function () {
		chrome.browserAction.setBadgeText({ text: "" });
	}, 1000);
}

chrome.commands.onCommand.addListener(function (command) {
	if (command === "reload") {
		reloadExtensions();
	}
});

// intercept url
chrome.webRequest.onBeforeRequest.addListener(
	function (details) {
		if (details.url.indexOf("http://reload.extensions") >= 0) {
			reloadExtensions();


			chrome.tabs.get(details.tabId, function (tab) {
				if (tab.selected === false) {
					console.log(details);
					chrome.tabs.remove(details.tabId);
				}
				chrome.tabs.query({ currentWindow: true, active: false }, function (tabs) {
					toReload = tabs[0].id;
					console.log(tabs[0].url);
					chrome.storage.sync.get("reloadPage", function (item) {
						if (item.reloadPage && toReload) {
							chrome.tabs.reload(toReload);
						}
					});
				});
			});
			return {
				// close the newly opened window
				redirectUrl: chrome.extension.getURL("close.html")
			};
		}

		return { cancel: false };
	},
	{
		urls: ["http://reload.extensions/"],
		types: ["main_frame"]
	},
	["blocking"]
);


chrome.browserAction.onClicked.addListener(function (/*tab*/) {
	reloadExtensions();
});
