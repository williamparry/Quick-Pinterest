window.onload = function () {

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
	
	function id(e) { return document.getElementById(e); }
	
	function close() {
		parent.postMessage(data.pin_id, data.url); // ask parent to remove
	}

	function removeProgressBar() {
		clearInterval(countDown);
		countDown = null;
		var EProgress = document.getElementById("progress");
		if (EProgress) {
			document.getElementById("main").removeChild(EProgress);
		}
	}

	
	title.innerHTML = 'Pinned to ' + data.board_name;

	img.src = data.imgData;

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