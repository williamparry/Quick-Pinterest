var QIHEIGHT = 100;

function notify(data) {
	

	var existingIframes = document.querySelectorAll(".quick-pinterest-notification");

	var EIFrame = document.createElement("iframe");

	EIFrame.style.position = "absolute";
	EIFrame.style.top = document.body.scrollTop + (existingIframes.length * QIHEIGHT) + 5 + "px";
	EIFrame.style.right = "5px";
	EIFrame.style.zIndex = "100000000";
	EIFrame.className = "quick-pinterest-notification";
	EIFrame.style.height = EIFrame.height = QIHEIGHT + "px";
	EIFrame.style.width = EIFrame.width = "350px";
	EIFrame.frameBorder = "0";

	EIFrame.src = chrome.extension.getURL("notification-pinned.html?r=" + (Math.random() * 999999) + "#data=" + JSON.stringify(data));

	document.body.appendChild(EIFrame);

	window.addEventListener("message", function (event) {
		if (event.data == data.pin_id) {
			document.body.removeChild(EIFrame);
			window.removeEventListener("message", arguments.callee);
		}
	}, false);
}


chrome.extension.onRequest.addListener(notify);