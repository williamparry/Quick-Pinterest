/*
 *  Pinterest.js
 *  Small library to communicate with Pinterest
 *  Based upon Quick-Pinterest code by William Parry.
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
 *  Neither the name of the Baker Framework nor the names of its contributors may be used to 
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
 * This library uses HTML scraping of the bookmarklet to work, since right now there's no API.
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
  
  boardsScheduleIsRunning: false,
  tokenScheduleIsRunning: false,
  
  
  getBoards: function(fx) {
    /****************************************************************************************************
     * Returns to the callback function an Array of board titles.
     * Returns instead int 401 if not logged in (equal to 401 Not Authorized HTTP).
     *
     */
    var self = this;
    
    if (!this.boardsScheduleIsRunning) {
      this.boardsScheduleIsRunning = true;
      
      var xhr = new XMLHttpRequest();
      xhr.open("GET", this.pinterestBookmarklet, true);
      
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // Convert Text to a HTML DOM (since the response is not text/xml we have to do this by hand)
            var xmlDOM = self._updateBody(xhr.responseText);
            
            var boardList = xmlDOM.querySelectorAll(".BoardList ul li");
            
            var boards = [];
            for (var i = 0; i < boardList.length; i++) {
              boards.push({
                  'title': boardList[i].querySelectorAll('span')[0].innerText,
                  'id': boardList[i].getAttribute('data')
              });
            }
            fx(boards); // CALLBACK -->
          } else {
            // ****** Handle logged out
            fx(401); // CALLBACK -->
          }
          
          this.boardsScheduleIsRunning = false;
        }
      }
      
      xhr.send(null);
    }
  },
  
  pin: function(boardId, mediaURL, description, fx) {
    /****************************************************************************************************
     * Pins a mediaURL media using the description as Description and boardId as target board.
     * The last parameter is the callback function.
     *
     */
    var self = this;
    
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
             pin_id: xmlDOM.querySelectorAll(".pinSuccess ul li:first-child a")[0].href.split('/')[4],
             board_id: board,
             board_name: xmlDOM.querySelectorAll(".pinSuccess h3 a")[0].innerHTML
           }
           
           fx(params); // CALLBACK -->
         } else {
           // ****** Handle logged out
           fx(401); // CALLBACK -->
         }
       }
     };
     
     // Pin!
     xhr.send("board=" + boardId + "&currency_holder=buyable&peeps_holder=replies&tag_holder=tags&title=" + description + "&media_url=" + encodeURIComponent(mediaURL) + "&csrfmiddlewaretoken=" + token + "&caption=" + description);
  },
  
  // **************************************************************************************************** OTHER API
  getToken: function(fx) {
    /****************************************************************************************************
     * Gets the token to allow posting and pass it as first parameter of the callback function.
     *
     */
    var self = this;
    var token = "";
    
    if (!this.tokenScheduleIsRunning) {
      this.tokenScheduleIsRunning = true;
      
      var xhr = new XMLHttpRequest();
      xhr.open("GET", this.pinterestBookmarklet, true);
      
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            // Convert Text to a HTML DOM (since the response is not text/xml we have to do this by hand)
            var xmlDOM = self._updateBody(xhr.responseText);
            
            token = xmlDOM.querySelectorAll("input[name='csrfmiddlewaretoken']")[0].value;
            
            fx(token); // CALLBACK -->
          } else {
            // ****** Handle logged out
            fx(401); // CALLBACK -->
          }
          this.tokenScheduleIsRunning = false;
        }
      }
      
      xhr.send(null);
    }
  },
  
  // **************************************************************************************************** SUPPORT
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