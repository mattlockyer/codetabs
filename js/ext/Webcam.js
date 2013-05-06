/*
 * How to use this Javascript module
 * 
 * Webcam.init([audio, width, height]); -> Request access to use cam, audio, width and height optional, defaults to 320x240 to keep things fast
 * 
 * Webcam.video; -> Video element
 * Example: if (Webcam.video) ctx.drawImage(Webcam.video, 0, 0);
 * 
 * Webcam.getVideoData(); -> Returns an ImageData object
 * Example: var videoData = Webcam.getVideoData();
 *          var width = videoData.width;
 *          var height = videoData.height;
 *          var pixels = videoData.pixels;
 *          
 *          *** Pixels are a 1 dimensional array of rgba values
 *          *** To get pixel x, y use pixels[ (y * width + x) * 4 + [1, 2, or 3] ]
 *          var pixel_16_4_red = pixels[(16 * width + 4) * 4]; // red offset 0
 *          var pixel_16_4_greeb = pixels[(16 * width + 4) * 4 + 1]; // green offset 1
 *          var pixel_16_4_blue = pixels[(16 * width + 4) * 4 + 2]; // red offset 2
 *          var pixel_16_4_alpha = pixels[(16 * width + 4) * 4 + 3]; // red offset 3
 */

var Webcam = (function() {
  var Webcam = {};
  Webcam.video = null;
  var w, h, canvas = null, stream = null;
  Webcam.init = function (audio, _w, _h) {
    //params
    w = (_w) ? _w : 320;
    h = (_h) ? _h : 240;
    //setup
    function onWebcamFail() {
      alert('Cannot use webcam!');
    }
    function hasGetUserMedia() {
      return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }
    if (!hasGetUserMedia()) {
      alert('getUserMedia() is not supported in your browser');
    }
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    //setup elements
    Webcam.video = document.createElement('video');
    Webcam.video.setAttribute('autoplay');
    var c = document.createElement('canvas');
    c.setAttribute('width', w);
    c.setAttribute('height', h);
    canvas = c.getContext('2d');
    //get video
    if (navigator.getUserMedia) { 
        navigator.getUserMedia( { video:true, audio:audio } , function(s) {
          stream = s;
          Webcam.video.src = window.URL.createObjectURL(stream);
        }, onWebcamFail);
    } else {
        Webcam.video.src = 'somevideo.webm'; // fallback.
    }
  }
  Webcam.getVideoData = function() {
    canvas.drawImage(Webcam.video, 0, 0, w, h);
    return canvas.getImageData(0, 0, w, h);
  }
  Webcam.stop = function() {
    stream.stop();
  }
  return Webcam;
}());