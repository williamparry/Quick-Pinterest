/*
*  background.js
*
*  Last update: 2012-05-26
*
*  ==========================================================================================
*  
*  Copyright (c) 2012, William Parry.
*  All rights reserved.
*  
*  Redistribution and use in source and binary forms, with or without modification, are 
*  permitted provided that the following conditions are met:
*  
*  Redistributions of source code must retain the above copyright notice, this list of 
*  conditions and the following disclaimer.
*  Redistributions in binary form must reproduce the above copyright notice, this list of 
*  conditions and the following disclaimer in the documentation and/or other materials 
*  provided with the distribution.
*  Neither the name of the Pinterest.js library nor the names of its contributors may be used to 
*  endorse or promote products derived from this software without specific prior written 
*  permission.
*  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
*  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES 
*  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT 
*  SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, 
*  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, 
*  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
*  INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
*  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
*  OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*/

var pinterestedTabs = [],
	timerSchedule = null;

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
	Pinterest.getBoards(function (boards) {

		if (boards.length > 0) {

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
