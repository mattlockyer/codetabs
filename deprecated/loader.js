
//Loader

var Loader = (function() {
    Loader = {};
    //Public Vars
    Loader.queue = [];
    Loader.callback = null;
    //Public Methods
    /*
     *Deprecated for this project
    Loader.start = function(callback) {
        Loader.callback = callback;
        Loader.process();
    }
    Loader.process = function() {
        var fn = Loader.queue.splice(0, 1)[0];
        if (fn) {
            Loader.load(fn);
        } else {
            if (Loader.callback) {
                Loader.callback();
            }
        }
    }
    Loader.load = function(fn) {
        var ft = getFiletype(fn);
        var f;
        if (ft == 'js') {
            f = document.createElement('script');
            f.setAttribute('type','text/javascript');
            f.setAttribute('src', fn);
        }
        else if (ft == 'css') {
            f = document.createElement('link');
            f.setAttribute('rel', 'stylesheet');
            f.setAttribute('type', 'text/css');
            f.setAttribute('href', fn);
        }
        if (typeof f !== 'undefined') {
            document.getElementsByTagName('head')[0].appendChild(f);
            var loaded = false;
            f.onreadystatechange = f.onload = function() {
                if (!loaded) {
                    Loader.process();
                }
                loaded = true;
            };
        }
    }
    */
    Loader.getQueueHTML = function() {
        var html = '';
        for (var i = 0; i < Loader.queue.length; ++i) {
            var ft = getFiletype(Loader.queue[i]);
            if (ft === 'js') {
                html += '<script type="text/javascript" src="' + Loader.queue[i] + '"></script>';
            } else if (ft === 'css') { 
                html += '<link rel="stylesheet" type="text/css" href="' + Loader.queue[i] + '"/>';
            }
        }
        return html;
    }
    //Private Methods
    var getFiletype = function(fn) {
        return fn.substring(fn.lastIndexOf('.') + 1);
    }
    return Loader;
}());