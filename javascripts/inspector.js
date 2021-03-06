/*
 * Inspector <https://github.com/xiaogaozi/inspector>
 * Copyright (C) 2011  xiaogaozi <gaochangjian@gmail.com>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
    var host, path;
    var maxInt = 2147483646;
    
    var Inspector = function() {
        this.oldElement = null;
        this.highlighter = null;
    };

    Inspector.prototype = {
        startInspecting: function(event) {
            this.highlight(event);
        },

        stopInspecting: function(event) {
            var element = event.target;
            var email = jQuery('input#lan-email').attr('value');
            var url = jQuery('input#lan-request-url').attr('value');
            var xpath = escape(this.getElementXPath(element));
            window.location = '/submit?email=' + email + '&url=' + url + '&xpath=' + xpath;
        },
        
        highlight: function(event) {
            var element = event.target;
            if (this.oldElement == element)
                return;
            if (this.oldElement && this.highlighter)
                document.body.removeChild(this.highlighter);
            this.oldElement = element;
            this.highlighter = this.getHighlighter(element);
            document.body.appendChild(this.highlighter);
        },

        getLTRBWH: function(element) {
            var bcrect,
                dims = {"left": 0, "top": 0, "right": 0, "bottom": 0, "width": 0, "height": 0};
        
            if (element)
            {
                bcrect = element.getBoundingClientRect();
                dims.left = bcrect.left;
                dims.top = bcrect.top;
                dims.right = bcrect.right;
                dims.bottom = bcrect.bottom;
        
                if (bcrect.width)
                {
                    dims.width = bcrect.width;
                    dims.height = bcrect.height;
                }
                else
                {
                    dims.width = dims.right - dims.left;
                    dims.height = dims.bottom - dims.ptop;
                }
            }
            return dims;
        },

        getHighlighter: function(element) {
            var div = document.createElement('div');
            var offset = this.getLTRBWH(element);
            var x = offset.left, y = offset.top;
            var w = offset.width, h = offset.height;
            var css = "left: " + x + "px !important; top: " + y +
                      "px !important; width: " + w + "px !important; height: " + h +
                      "px !important; position: fixed !important; z-index: " + maxInt + " !important; pointer-events: none !important; box-shadow: 0 0 2px 2px #3875D7 !important; -moz-box-shadow: 0 0 2px 2px #3875D7 !important; -webkit-box-shadow: 0 0 2px 2px #3875D7 !important;";
            div.style.cssText = css;
            return div;
        },

        getElementXPath: function(element) {
            if (element && element.id)
                return '//*[@id="' + element.id + '"]';
            else
                return this.getElementTreeXPath(element);
        },

        getElementTreeXPath: function(element) {
            var paths = [];

            // Use nodeName (instead of localName) so namespace prefix is included (if any).
            for (; element && element.nodeType == 1; element = element.parentNode)
            {
                var index = 0;
                for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling)
                {
                    // Ignore document type declaration.
                    if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                        continue;

                    if (sibling.nodeName == element.nodeName)
                        ++index;
                }

                var tagName = element.nodeName.toLowerCase();
                var pathIndex = (index ? "[" + (index+1) + "]" : "");
                paths.splice(0, 0, tagName + pathIndex);
            }

            return paths.length ? "/" + paths.join("/") : null;
        },

        getOuterHTML: function(element) {
            return jQuery('<div></div>').append(jQuery(element).clone()).html();
        }
    };

    function isabsolute(url)
    {
        if ((typeof url === "undefined") ||
            url.search(/^(http|https):\/\//) != -1 ||
            url.search(/^\/\//) != -1)
            return true;
        else
            return false;
    }

    function urljoin(base, url)
    {
        base = base.replace(/\/$/, '');
        url = url.replace(/^\//, '');
        return base + '/' + url;
    }

    function urlfilter($obj, attr)
    {
        var h = $obj.attr(attr);
        if (!isabsolute(h))
        {
            if (h.search(/^\//) != -1)
                $obj.attr(attr, urljoin(host, h));
            else
                $obj.attr(attr, urljoin(path, h));
        }
    }

    function post_processing()
    {
        jQuery('title').html('Inspector');
        
        jQuery('a').each(function(i) {
            urlfilter(jQuery(this), 'href');
        });
        jQuery('img').each(function(i) {
            urlfilter(jQuery(this), 'src');
        });
        jQuery('link').each(function(i) {
            urlfilter(jQuery(this), 'href');
        });
        jQuery('frame').each(function(i) {
            urlfilter(jQuery(this), 'src');
        });        
        jQuery('script').each(function(i) {
            urlfilter(jQuery(this), 'src');
        });

        var $tips = jQuery('<iframe src="/tips" scrolling="no" id="lan-tips"><p>Your browser does not support iframes.</p></iframe>');
        $tips.css({
            'position': 'fixed',
            'left': '0px',
            'bottom': '0px',
            'width': '100%',
            'height': '65px',
            'border-style': 'none',
            'overflow': 'hidden',
            'z-index': maxInt
        });
        $tips.bind('mouseover', function() {
            if ($tips.css('bottom') == '0px')
            {
                $tips.css('bottom', '');
                $tips.css('top', '0px');
            }
            else
            {
                $tips.css('bottom', '0px');
                $tips.css('top', '');
            }
        });
        jQuery('body').append($tips);
    }

    jQuery(document).ready(function() {
        host = unescape(jQuery('input#lan-url-host').attr('value'));
        path = unescape(jQuery('input#lan-url-path').attr('value'));
        post_processing();

        var i = new Inspector();
        jQuery('body').bind('mouseover', function(event) { i.startInspecting(event); });
        jQuery('body').bind('mouseup', function(event) { i.stopInspecting(event); });
        jQuery('body').bind('click', function(event) {
            event.stopPropagation();
            event.preventDefault();
        });
    });
})();