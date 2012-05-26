/*
*  becausemac.js
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
* ----------------------------------------------------------------------------------------------
* Why does this file exist? webkitnotifications fail on mac
* ----------------------------------------------------------------------------------------------
*/

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

	var canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d');
		img = document.querySelectorAll("img[src='" + data.media_url + "']")[0];

	// Take THAT CSP
	canvas.width = img.width;
	canvas.height = img.height;
	ctx.drawImage(img, 0, 0);

	data.imgData = canvas.toDataURL();

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