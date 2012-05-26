/*
 *  Pinterest.js
 *  Small library to communicate with Pinterest
 *  Based upon Quick-Pinterest code by William Parry.
 *
 *  Last update: 2012-05-13
 *
 *  ==========================================================================================
 *  
 *  Copyright (c) 2012, Davide Casali.
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
 ********************************************************************************************************
 *
 *  This library uses HTML scraping of the bookmarklet to work, since right now there's no API.
 *
 ********************************************************************************************************
 *
 * USAGE:
 *
 * Pinterest.getBoards(function(boards) { console.log(boards); });
 * Pinterest.pin(boardId, mediaURL, description, function(pinnedObject) { console.log(pinnedObject); });
 * 
 */



var Pinterest = {
  
  pinterestBookmarklet: "http://pinterest.com/pin/create/bookmarklet/",
  
  token: null, // this stores the token taken from the form and used in the POST request to pin a new media URL.
  boards: null,
  
  cfgScheduleIsRunning: false,
  
  // **************************************************************************************************** API
  getBoards: function(fx) {
    /****************************************************************************************************
     * Returns to the callback function an Array of board titles.
     * Returns instead int 401 if not logged in (equal to 401 Not Authorized HTTP).
     *
     */
    var self = this;
    
    if (this.boards) {
      // ****** Boards available, just return them
      fx(this.boards); // CALLBACK -->
    } else {
      // ****** Boards are missing, get them implicitly.
      this.initConfiguration(function () {
        if (self.boards) fx(self.boards); // CALLBACK -->
        else fx(null); // CALLBACK -->
      });
    }
  },
  pin: function(boardId, mediaURL, description, fx) {
    /****************************************************************************************************
     * Pins a mediaURL media using the description as Description and boardId as target board.
     * The last parameter is the callback function.
     *
     */
    var self = this;
    
    if (!this.token) {
      // ****** Token is missing, get it implicitly.
      this.initConfiguration(function () {
        if (self.token) self.pin(boardId, mediaURL, description, fx); // if token was retrieved, try again pinning
        else fx(401); // CALLBACK -->
      });
    } else {
      // ****** Token available, let's go!
      var xhr = new XMLHttpRequest();
      xhr.open("POST", this.pinterestBookmarklet, true);
      
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // Convert Text to a HTML DOM (since the response is not text/xml we have to do this by hand)
            var xmlDOM = self._updateBody(xhr.responseText);
            
            // Prepare params
            var params = {
              media_url: mediaURL,
              description: description,
              pin_id: xmlDOM.querySelectorAll(".pinSuccess ul li:first-child a")[0].attributes.href.nodeValue.split("/")[2],
              board_id: boardId,
              board_name: xmlDOM.querySelectorAll(".pinSuccess h3 a")[0].innerHTML
            }
            
            fx(params); // CALLBACK -->
          } else {
            // ****** Handle error statuses
            fx(xhr.status); // CALLBACK -->
          }
        }
      };

      // Pin!
      xhr.send("board=" + boardId + "&currency_holder=buyable&peeps_holder=replies&tag_holder=tags&title=" + description + "&media_url=" + encodeURIComponent(mediaURL) + "&csrfmiddlewaretoken=" + this.token + "&caption=" + description);
    }
  },
  
  // **************************************************************************************************** SUPPORT API
  getToken: function(fx) {
    /****************************************************************************************************
     * Gets the token to allow posting and pass it as first parameter of the callback function.
     *
     */
    var self = this;
    
    if (this.token) {
      // ****** Token available, just return it
      fx(this.token); // CALLBACK -->
    } else {
      // ****** Token is missing, get it implicitly.
      this.initConfiguration(function () {
        fx(self.token); // CALLBACK -->
      });
    }
  },
  initConfiguration: function(fx) {
    /****************************************************************************************************
     * Gets all the configuration data needed from the bookmarklet: boards and token.
     * The values are assigned to the internal class variables.
     * Accepts an optional function parameter triggered when the initialization process is completed.
     *
     * NOTE: While getToken and getBoards doesn't force update the class variables, this routine does.
     *
     */
    var self = this;
    
    this.getConfiguration(function (token, boards) {
      if (token) {
        // ****** Success, set the values
        self.token = token;
        self.boards = boards;
      } else {
        // ****** Failure, reset them to avoid troubles
        self.token = null;
        self.boards = null;
      }
      
      if (fx) fx(); // CALLBACK -->
    });
  },
  getConfiguration: function(fx) {
    /****************************************************************************************************
     * Gets all the configuration data needed from the bookmarklet: boards and token.
     * Returns to the callback functions two parameters: the token and the boards Array.
     * Returns null as the token and 401 instead of the array if it's not logged in or something happens.
     * 
     * NOTE: While getToken and getBoards doesn't force update the class variables, this routine does.
     *
     */
    var self = this;
    var token = "";
    
    if (!this.cfgScheduleIsRunning) {
      this.cfgScheduleIsRunning = true;
      
      var xhr = new XMLHttpRequest();
      xhr.open("GET", this.pinterestBookmarklet, true);
      
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // Convert Text to a HTML DOM (since the response is not text/xml we have to do this by hand)
            var xmlDOM = self._updateBody(xhr.responseText);
            
            // ****** Get Token
            token = xmlDOM.querySelectorAll("input[name='csrfmiddlewaretoken']")[0].value;
            
            // ****** Get Boards
            var boardList = xmlDOM.querySelectorAll(".BoardList ul li");
            
            var boards = [];
            for (var i = 0; i < boardList.length; i++) {
              boards.push({
                  'title': boardList[i].querySelectorAll('span')[0].innerText,
                  'id': boardList[i].getAttribute('data')
              });
            }
            
            fx(token, boards); // CALLBACK -->
          } else {
            // ****** Handle logged out
            fx(null, xhr.status); // CALLBACK -->
          }
          self.cfgScheduleIsRunning = false;
        }
      }
      
      xhr.send(null);
    }
  },
  
  // **************************************************************************************************** INTERNAL
  _updateBody: function(str) {
    /****************************************************************************************************
     * This function creates a new document object to be used to parse a HTML string.
     * 
     */
    var domDocument = document.implementation.createHTMLDocument();
    
    var range = domDocument.createRange();
    range.selectNode(domDocument.body);
    var documentFragment = range.createContextualFragment(str);
    domDocument.body.innerHTML = "";
    domDocument.body.appendChild(documentFragment);
    
    return domDocument;
  }
}