/*
Copyright William Parry 2012

This script is intended for general use and no warranty is implied for suitability to any given task. 
I hold no responsibility for your setup or any damage done while using/installing/modifing this script.
*/

var boardsSchedule,
	boardsScheduleIsRunning = false,
	tokenSchedule,
	tokenScheduleIsRunning = false,
	token,
	pinterestedTabs = [],
	Titles = {
		Login: "Pinterest / Login",
		Verification: "Sorry!"
	},
	currentTitle;

function updateBody(str) {
	var range = document.createRange();
	range.selectNode(document.body);
	var documentFragment = range.createContextualFragment(str);
	document.body.innerHTML = "";
	document.body.appendChild(documentFragment);
	currentTitle = document.querySelectorAll('title')[0].innerHTML;
}
function getToken() {
	if (!tokenScheduleIsRunning) {
		tokenScheduleIsRunning = true;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://pinterest.com/pin/create/bookmarklet/", true);
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
	chrome.contextMenus.create({ "title": "Log into Pinterest", "contexts": ["all"],
		"onclick": function (obj) {
			chrome.tabs.create({ "url": "https://pinterest.com/login/?next=/", "selected": true });
		}
	});
}

function getBoards() {
	if (!boardsScheduleIsRunning) {
		boardsScheduleIsRunning = true;
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://pinterest.com/pin/create/bookmarklet/", true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					chrome.contextMenus.removeAll();
					var contextMenuImage = chrome.contextMenus.create({ "title": "Pin image to", "contexts": ["image"] });
					updateBody(xhr.responseText);
					var boardList = document.querySelectorAll(".BoardList ul li");
					if(boardList.length > 0) {
						for (var i = 0; i < boardList.length; i++) {
							(function (board) {
								var boardTitle = board.querySelectorAll('span')[0].innerText;
								chrome.contextMenus.create({ "title": boardTitle, "contexts": ["image"],
									"onclick": function (obj) {
										pin(board.getAttribute('data'), obj.srcUrl);
									}, "parentId": contextMenuImage
								});
							})(boardList[i]);
						}
					} else {
						makeLoggedOutMenu();
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

function flashLogout() {
	var notification = webkitNotifications.createNotification("img/logo.png", "You're logged out!", "Please log into Pinterest and try again.");
	notification.show();
	setTimeout(function () { notification.cancel(); }, 3000);
}


// Edit pin
chrome.extension.onRequest.addListener(function (resp, sender, sendResponse) {
	setActive();
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://pinterest.com/pin/" + resp.Data.pin_id + "/edit/", true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				updateBody(xhr.responseText);
				if(currentTitle === Titles.Login) {
					flashLogout();
					handleLoggedOut();
					sendResponse(false);
				} else {
					sendResponse(true);
				}
			} else {
				sendResponse(false);
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
		xhr.open("POST", "https://pinterest.com/pin/create/bookmarklet/", true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					
					// Potential conflict with getBoards method, but not likely
					updateBody(xhr.responseText);
					
					if (currentTitle === Titles.Verification) {
						chrome.tabs.create({url: "https://pinterest.com/verify_captcha/?src=pinmarklet&return=%2F"});
						
						var notification = webkitNotifications.createNotification("img/logo.png", "Verification needed", "Pinterest wants you to prove you are not a robot first...");
						notification.show();
						setTimeout(function () { notification.cancel(); }, 3000);
						
					} else if(currentTitle === Titles.Login) {
						flashLogout();
						handleLoggedOut();
					} else {
						
						var data = {
							tab_id: tab.id,
							url: tab.url,
							media_url: media_url,
							description: title,
							pin_id: document.querySelectorAll(".pinSuccess ul li:first-child a")[0].href.split('/')[4],
							board_id: board,
							board_name: document.querySelectorAll(".pinSuccess h3 a")[0].innerHTML
						}
						
						if (pinterestedTabs.indexOf(tab.id) !== -1) {
							chrome.tabs.sendRequest(tab.id, data);
						} else {
							pinterestedTabs.push(tab.id);
							chrome.tabs.executeScript(tab.id, { file: "conduit.js" }, function () {
								chrome.tabs.sendRequest(tab.id, data);
							});
						}

					}


				} else {
					var notification = webkitNotifications.createNotification("img/logo.png", "Something has gone wrong...", "Try again?");
					notification.show();
					setTimeout(function () { notification.cancel(); }, 3000);
				}

				setInactive();
			}
		};
		xhr.send("board=" + board + "&currency_holder=buyable&peeps_holder=replies&tag_holder=tags&title=" + title + "&media_url=" + encodeURIComponent(media_url) + "&url=" + encodeURIComponent(tab.url) + "&csrfmiddlewaretoken=" + token + "&caption=" + title);
	});
}

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({ "url": "https://pinterest.com/", "selected": true });
});

chrome.tabs.onRemoved.addListener(function (tabid) {
	var ind = pinterestedTabs.indexOf(tabid);
	if (ind !== -1) {
		pinterestedTabs.splice(ind, 1);
	}
});

startTokenSchedule();