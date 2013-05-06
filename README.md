# Code Tabs

An online editor for html, css, js with TABS

### Setup

```html
<div class="codetabs" data-name="sketch">
   <!-- First Tab -->
   <textarea data-name="sketch.html"></textarea>
   <!-- Third Tab -->
   <textarea data-name="sketch.js"></textarea>
   <!-- Second Tab -->
   <textarea data-name="sketch.css"></textarea>
</div>
```

### Options

- data-name="sketch" (name will become the id of the iframe)
- data-width="800" (default: fit parent)
- data-height="300" (default: fit parent)
- data-fontsize="16px" (set the font size, default: 14px)
- data-lines="#eee" (editor lines, default: none)
- data-background="#aaa" (editor background, default: none)
- data-nohints="true" (disable code hinting)
- data-nozip="true (disable downloadin of zip)
- data-nofullscreen="true" (disable fullscreen)
- data-isplaying="true" (start with preview)
- data-isfullscreen="true" (start fullscreen)
- data-ishidden="true" (start hidden)
- data-images="img/cat.jpg" (images to preload)
- data-webcam="true" (include webcam script check js/ext/webcam.js)
- data-scripts="http://cdnjs.cloudflare.com/ajax/libs/three.js/r57/three.min.js" (js scripts to load)
- data-processing="js/local/processing-1.4.1.min.js" (using processing, use sketch.pde for first tab)
- data-appendbody="true" (when created append to body tag (centered) instead of to the parent tag, requires width and height)


