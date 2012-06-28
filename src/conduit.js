var NotificationHeight = 100;

function arrayBufferDataUri(raw){var base64='';var encodings='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';var bytes=new Uint8Array(raw);var byteLength=bytes.byteLength;var byteRemainder=byteLength%3;var mainLength=byteLength-byteRemainder;var a,b,c,d;var chunk;for(var i=0;i<mainLength;i=i+3){chunk=(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];a=(chunk&16515072)>>18;b=(chunk&258048)>>12;c=(chunk&4032)>>6;d=chunk&63;base64+=encodings[a]+encodings[b]+encodings[c]+encodings[d]}
if(byteRemainder==1){chunk=bytes[mainLength];a=(chunk&252)>>2;b=(chunk&3)<<4;base64+=encodings[a]+encodings[b]+'==';}
else if(byteRemainder==2){chunk=(bytes[mainLength]<<8)|bytes[mainLength+1];a=(chunk&16128)>>8;b=(chunk&1008)>>4;c=(chunk&15)<<2;base64+=encodings[a]+encodings[b]+encodings[c]+'=';}
return"data:image/jpeg;base64,"+base64;}

function notify(data) {
	
	var existingIframes = document.querySelectorAll(".quick-pinterest-notification");

	var iFrame = document.createElement("iframe");

	iFrame.style.position = "absolute";
	iFrame.style.top = document.body.scrollTop + (existingIframes.length * NotificationHeight) + 5 + "px";
	iFrame.style.right = "5px";
	iFrame.style.zIndex = "100000000";
	iFrame.className = "quick-pinterest-notification";
	iFrame.style.height = iFrame.height = NotificationHeight + "px";
	iFrame.style.width = iFrame.width = "350px";
	iFrame.frameBorder = "0";
	
	data.media_url = data.media_url.indexOf(location.protocol) !== -1 ? data.media_url : location.protocol + data.media_url;
	
	var xhr = new XMLHttpRequest();
	xhr.open("GET", data.media_url, true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function() {
	    var img = new Image();
		data.imgData = arrayBufferDataUri(xhr.response);
		iFrame.src = chrome.extension.getURL("notification.html?r=" + Math.round(Math.random() * 999999) + "#data=" + JSON.stringify(data));
		window.addEventListener("message", function (evt) {
			if (evt.data == data.pin_id) {
				document.documentElement.removeChild(iFrame);
				window.removeEventListener("message", arguments.callee);
			}
		}, false);
		document.documentElement.appendChild(iFrame);
	};
	xhr.send(null);
}

// First the background page checks to see if the script has already been added to the page
// Then it sends a request (there's only one), which is handled by notify()
chrome.extension.onRequest.addListener(notify);