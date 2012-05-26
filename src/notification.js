/*
*  notification.js
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

window.onload = function () {


	function close() {
		parent.postMessage(data.pin_id, data.page_url); // ask parent to remove
	}

	function removeProgressBar() {
		clearInterval(countDown);
		countDown = null;

		var EProgress = document.getElementById("progress");
		if (EProgress) {
			document.getElementById("main").removeChild(EProgress);
		}
	}

	function id(e) { return document.getElementById(e); }

	var countDownAmount = 5000,
		currentCount = countDownAmount,
		countDown = null,
		data = JSON.parse(window.location.hash.split('#data=')[1]),
		title = id("title"),
		txtDescription = id("txtDescription"),
		btnUpdate = id("btnUpdate"),
		form = id("frmUpdate"),
		error = id("error"),
		img = id("imgMain");


	title.innerHTML = 'Pinned to ' + data.board_name;

	img.src = data.imgData; // from canvas

	img.onload = function () {
		if (this.width >= this.height) {
			this.width = Math.min(45, this.width);
		} else {
			this.height = Math.min(45, this.height);
		}
		img.style.display = "block";
	}

	form.onsubmit = function (e) {
		e.preventDefault();
		error.style.display = "none";
		txtDescription.disabled = "disabled";
		btnUpdate.disabled = "disabled";
		btnUpdate.value = "Updating...";

		data.description = txtDescription.value;

		chrome.extension.sendRequest({ Data: data }, function (success) {
			if (success) {
				btnUpdate.value = "Updated!";
				setTimeout(function () {
					close();
				}, 2000);
			} else {
				error.style.display = "block";
				txtDescription.removeAttribute("disabled");
				btnUpdate.removeAttribute("disabled");
				btnUpdate.value = "Update";
			}
		});
	}

	var EProgress = document.getElementById("progress");
	countDown = setInterval(function () {
		currentCount -= 50;
		if (currentCount == 0) {
			close();
		} else {
			EProgress.style.width = Math.round((currentCount / countDownAmount) * 100) + "%";
		}
	}, 50);

	txtDescription.placeholder = data.description;
	txtDescription.onclick = removeProgressBar;
	btnUpdate.onclick = removeProgressBar;
}