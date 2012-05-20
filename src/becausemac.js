var QIHEIGHT = 100;


function notify(data) {
  /*****************************************************************************************************
   * Creates the notification panel
   * This script is going to be loaded once per tab, see the pin() function in background.js
   */
	
	var existingIframes = document.querySelectorAll(".quick-pinterest-notification");
	var EIFrame = document.createElement("iframe");
	
	// Define iframe
	EIFrame.style.position = "absolute";
	EIFrame.style.top = document.body.scrollTop + (existingIframes.length * QIHEIGHT) + 5 + "px";
	EIFrame.style.right = "5px";
	EIFrame.style.zIndex = "100000000";
	EIFrame.className = "quick-pinterest-notification";
	EIFrame.style.height = EIFrame.height = QIHEIGHT + "px";
	EIFrame.style.width = EIFrame.width = "350px";
	EIFrame.frameBorder = "0";
	
	// Load & attach the notification HTML
	EIFrame.src = chrome.extension.getURL("notification-pinned.html?r=" + (Math.random() * 999999) + "#data=" + JSON.stringify(data));
	document.body.appendChild(EIFrame);
	
	// Add event listener for close event
	window.addEventListener("message", function (event) {
		if (event.data == data.pin_id) {
			document.body.removeChild(EIFrame);
			window.removeEventListener("message", arguments.callee);
		}
	}, false);
}


chrome.extension.onRequest.addListener(notify);