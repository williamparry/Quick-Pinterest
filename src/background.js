/*
Copyright William Parry 2012

This script is intended for general use and no warranty is implied for suitability to any given task. 
I hold no responsibility for your setup or any damage done while using/installing/modifing this script.
*/

var boardsSchedule,
	boardsScheduleIsRunning = false,
	tokenSchedule,
	tokenScheduleIsRunning = false,
	token;

function updateBody(str) {
	var range = document.createRange();
	range.selectNode(document.body);
	var documentFragment = range.createContextualFragment(str);
	document.body.innerHTML = "";
	document.body.appendChild(documentFragment);
}

function getToken() {
	if (!tokenScheduleIsRunning) {
		tokenScheduleIsRunning = true;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://pinterest.com/pin/create/bookmarklet/", true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					updateBody(xhr.responseText);
					token = document.querySelectorAll("input[name='csrfmiddlewaretoken']")[0].value;
					stopTokenSchedule();
					startBoardsSchedule();
				} else {
					makeLoggedOutMenu();
				}
				tokenScheduleIsRunning = false;
			}
		};
		xhr.send(null);
	}
}

function startBoardsSchedule() {
	boardsSchedule = setInterval(getBoards, 60000);
	getBoards();
}

function stopBoardsSchedule() {
	clearInterval(boardsSchedule);
	boardsSchedule = null;
}

function startTokenSchedule() {
	tokenSchedule = setInterval(getToken, 5000);
	getToken();
}

function stopTokenSchedule() {
	clearInterval(tokenSchedule);
	tokenSchedule = null;
}

function setActive() {
	chrome.browserAction.setIcon({ path: "img/icon-active.png" });
}

function setInactive() {
	chrome.browserAction.setIcon({ path: "img/icon.png" });
}

function handleLoggedOut() {
	stopBoardsSchedule();
	token = null;
	makeLoggedOutMenu();
	startTokenSchedule();
}

function makeLoggedOutMenu() {
	chrome.contextMenus.removeAll();
	chrome.contextMenus.create({ "title": "Log into your Pinterest Account", "contexts": ["all"],
		"onclick": function (obj) {
			chrome.tabs.create({ "url": "https://pinterest.com/login/?next=/", "selected": true });
		}
	});
}

function getBoards() {
	if (!boardsScheduleIsRunning) {
		boardsScheduleIsRunning = true;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "http://pinterest.com/pin/create/bookmarklet/", true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					chrome.contextMenus.removeAll();
					var contextMenuImage = chrome.contextMenus.create({ "title": "Pin image to", "contexts": ["image"] }),
					contextMenuVideo = chrome.contextMenus.create({ "title": "Pin video to", "contexts": ["video"] });
					
					updateBody(xhr.responseText);
					var boardList = document.querySelectorAll(".BoardList ul li");
					for (var i = 0; i < boardList.length; i++) {
						(function (board) {
							var boardTitle = board.querySelectorAll('span')[0].innerText;
							chrome.contextMenus.create({ "title": boardTitle, "contexts": ["image"],
								"onclick": function (obj) {
									pin(board.getAttribute('data'), obj.srcUrl);
								}, "parentId": contextMenuImage
							});
							chrome.contextMenus.create({ "title": boardTitle, "contexts": ["video"],
								"onclick": function (obj) {
									pin(board.getAttribute('data'), obj.pageUrl);
								}, "parentId": contextMenuVideo
							});
						})(boardList[i]);
					}
				} else {
					handleLoggedOut();
				}
				boardsScheduleIsRunning = false;
			}
		};
		xhr.send(null);
	}
}


// Edit pin
chrome.extension.onRequest.addListener(function (resp, sender, sendResponse) {
	setActive();
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "http://pinterest.com/pin/" + resp.Data.pin_id + "/edit/", true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				sendResponse(true);
			} else {
				sendResponse(false);
				var notification = webkitNotifications.createNotification("img/logo.png", "You're logged out!", "Please log into Pinterest and try again.");
				notification.show();
				setTimeout(function () { notification.cancel(); }, 3000);
				handleLoggedOut();
			}
			setInactive();
		}
	}

	xhr.send("details=" + resp.Data.description + "&link=" + resp.Data.url + "&board=" + resp.Data.board_id + "&csrfmiddlewaretoken=" + token);


});



function pin(board, media_url, title) {
	setActive();
	chrome.tabs.getSelected(null, function (tab) {
		title = title ? title : tab.title;
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://pinterest.com/pin/create/bookmarklet/", true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					updateBody(xhr.responseText);
					var params = {
						url: tab.url,
						media_url: media_url,
						description: title,
						pin_id: document.querySelectorAll(".pinSuccess ul li:first-child a")[0].href.split('/')[4],
						board_id: board,
						board_name: document.querySelectorAll(".pinSuccess h3 a")[0].innerHTML
					}

					if (navigator.appVersion.indexOf("Mac") != -1) {
						chrome.windows.create({ url: "notification-pinned.html#" + JSON.stringify(params), type: "popup", width: 350, height: 150 });
					} else {
						var notification = webkitNotifications.createHTMLNotification("notification-pinned.html#" + JSON.stringify(params)).show();
					}
				} else {
					var notification = webkitNotifications.createNotification("img/logo.png", "You're logged out!", "Please log into Pinterest and try again.");
					notification.show();
					setTimeout(function () { notification.cancel(); }, 3000);

					handleLoggedOut();
				}

				setInactive();
			}
		};
		xhr.send("board=" + board + "&currency_holder=buyable&peeps_holder=replies&tag_holder=tags&title=" + title + "&media_url=" + encodeURIComponent(media_url) + "&url=" + encodeURIComponent(tab.url) + "&csrfmiddlewaretoken=" + token + "&caption=" + title);
	});
}

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({ "url": "http://pinterest.com/", "selected": true });
});

startTokenSchedule();