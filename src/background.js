/*
Copyright William Parry 2012

This script is intended for general use and no warranty is implied for suitability to any given task. 
I hold no responsibility for your setup or any damage done while using/installing/modifing this script.
*/

// **************************************************************************************************** INTERNAL
var pinterestedTabs = [];
var timerSchedule = null;

function startSchedule() {
  // Prepare
  function tickGetConfiguration() {
    Pinterest.initConfiguration(getBoards);
  } 
  
  // Call
	timerSchedule = setInterval(tickGetConfiguration, 60000);
	tickGetConfiguration();
}

function stopSchedule() {
	clearInterval(timerSchedule);
	timerSchedule = null;
}

function setActive() {
	chrome.browserAction.setIcon({ path: "img/icon-active.png" });
}

function setInactive() {
	chrome.browserAction.setIcon({ path: "img/icon.png" });
}

function handleLoggedOut() {
	makeLoggedOutMenu();
}

function makeLoggedOutMenu() {
	chrome.contextMenus.removeAll();
	chrome.contextMenus.create({ "title": "Log into your Pinterest Account", "contexts": ["all"],
		"onclick": function (obj) {
			chrome.tabs.create({ "url": "https://pinterest.com/login/?next=/", "selected": true });
		}
	});
}


// **************************************************************************************************** PINTEREST CALLS
function getBoards() {
    Pinterest.getBoards(function __getBoards(boards) {
        console.log(boards);
        if (boards.length > 0) {
            // We have boards, let's create the menu

            chrome.contextMenus.removeAll();
            var contextMenuImage = chrome.contextMenus.create({ "title": "Pin image to", "contexts": ["image"] });

            for (var i = 0; i < boards.length; i++) {
                (function (board) {
                    chrome.contextMenus.create({ "title": board.title, "contexts": ["image"],
                        "onclick": function (obj) {
                            pin(board.id, obj.srcUrl);
                        }, "parentId": contextMenuImage
                    });
                })(boards[i]);
            }

        } else {
            // Uh oh, no boards.
            handleLoggedOut();
        }
    });
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

	xhr.send("details=" + resp.Data.description + "&link=" + resp.Data.media_url + "&board=" + resp.Data.board_id + "&csrfmiddlewaretoken=" + Pinterest.token);

});


function pin(board, media_url, title) {
  
  setActive();
	chrome.tabs.getSelected(null, function (tab) {
		title = title ? title : tab.title;
		
		// Pin!
		Pinterest.pin(board, media_url, title, function(pinnedObject) { 
		  if (isNaN(pinnedObject)) {
		    // ****** Pinned
		    
		    // Add more data
		    pinnedObject.page_url = tab.url; // this is used to message back with parent.postMessage()
		    
		    // Open the message overlay
		    if (pinterestedTabs.indexOf(tab.id) !== -1) {
		      // If the page has the script loaded already
					chrome.tabs.sendRequest(tab.id, pinnedObject);
				} else {
				  // If the page hasn't the script already
					pinterestedTabs.push(tab.id);
					chrome.tabs.executeScript(tab.id, { file: "becausemac.js" }, function () {
						chrome.tabs.sendRequest(tab.id, pinnedObject);
					});
				}
		  } else {
		    // ****** Error
		    var nTitle = "";
		    var nMessage = "";
		    
		    if (pinnedObject >= 500) {
		      // Internal server errors
		      nTitle = "Pinterest had an hiccup";
		      nMessage = "Please try again pinning by using the Pinterest bookmarklet to see if the problem persists";
		    } else {
		      // Most likely logged out
		      nTitle = "You're logged out!";
		      nMessage = "Please log into Pinterest and try again.";
		    }
		    
		    // Show error message
		    var notification = webkitNotifications.createNotification("img/logo.png", nTitle, nMessage);
				notification.show();
				setTimeout(function () { notification.cancel(); }, 3000);
				
		    handleLoggedOut();
		  }
		  
		  setInactive();
	  });
	});
  
  /* From Pinterest.js
   var params = {
      media_url: mediaURL,
      description: description,
      pin_id: xmlDOM.querySelectorAll(".pinSuccess ul li:first-child a")[0].href.split('/')[4],
      board_id: boardId,
      board_name: xmlDOM.querySelectorAll(".pinSuccess h3 a")[0].innerHTML
    }
  */
  
	/*setActive();
	chrome.tabs.getSelected(null, function (tab) {
		title = title ? title : tab.title;
		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://pinterest.com/pin/create/bookmarklet/", true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					updateBody(xhr.responseText);
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
						chrome.tabs.executeScript(tab.id, { file: "becausemac.js" }, function () {
							chrome.tabs.sendRequest(tab.id, data);
						});
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
	});*/
}



// **************************************************************************************************** OTHER
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({ "url": "http://pinterest.com/", "selected": true });
});

chrome.tabs.onRemoved.addListener(function (tabid) {
	var ind = pinterestedTabs.indexOf(tabid);
	if (ind !== -1) {
		pinterestedTabs.splice(ind, 1);
	}
});


// **************************************************************************************************** LET'S GO!
startSchedule();
