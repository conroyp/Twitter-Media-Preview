var jqLoaded = false;

var twitterMediaPreview = function () {
    return {
        init : function () {
            gBrowser.addEventListener("load", function (event) {
                var dcTab = window.top.getBrowser().selectedBrowser.contentWindow.location.href;

                // By default, assume we're not on twitter
                var onTwitter = false;

                // Only run on pages with urls beginning http://twitter.com or http://api.twitter.com
                // Don't run on https as we're pulling insecure content in previews
                onTwitter = ( (dcTab.indexOf('http://twitter.com') == 0) || (dcTab.indexOf('http://api.twitter.com') == 0) );

                // Run automatically on twitter
                if (onTwitter) {
                    if(!jqLoaded)
                    {
                        var jsLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);

                        // @TODO: Only load once
                        jsLoader.loadSubScript("chrome://twittermediapreview/content/jquery-1.4.4.min.js");

                        // Set up noconflict jQuery so we don't kill other extensions
                        jQuery.noConflict();

                        // Set semaphore so we don't reload it needlessly
                        jqLoaded = true;
                    }

                    twitterMediaPreview.run();
                }
            }, false);
        },

        run : function () {
            doc = document.defaultView;

            // Imgur.com preview
            window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.mediaType('twttr.media.types.Imgur',
                {icon:'photo'
                ,domain:'http://imgur.com'
                ,matchers:{media:/imgur.com\/([a-zA-Z0-9\.]+)/g}
                    ,process:function(A){
                            // imgur.com (not sub-domain) doesn't have extension. Guess at jpeg.
                        if(this.slug.indexOf('.')<0)
                            this.slug = this.slug + '.jpg';
                        this.data.src=this.slug;
                        this.data.name=this.constructor._name;
                        A()
                    }
                    ,render:function(B) {
                        var img = 'http://i.imgur.com/{src}';
                        var A='<div class=\'twitpic\'><a class=\'inline-media-image\' href=\''+img+'\' target=\'_blank\'> <img src=\''+img+'\' /></a></div>';
                        jQuery(B, doc).append(window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.supplant(A,this.data))
                    }
                }
            );


            // Daft.ie SMI
            window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.mediaType('twttr.media.types.Daft',
                {icon:'photo'
                ,domain:'http://www.daft.ie/'
                ,matchers:{media:/daft.ie\/([a-zA-Z0-9\.\/\?\=]+)/g}
                ,process:function(A){
                    this.data.src=this.slug;
                    this.data.name=this.constructor._name;
                    A()
                }
                ,render:function(B) {
                    var price = '';
                    var address = '';
                    var photo = '';
                    var details = '';
                    var dt = this.data;

                    var srcUrl = 'http://www.daft.ie/'+this.slug;
                    jQuery.ajax({
                        url: srcUrl,
                        success: function(d) {
                            var dommer = HTMLParser(d);
                            address = jQuery(dommer).find('#smi_title h1').text();
                            price = jQuery(dommer).find('#price').text();

                            // Finance strap-line corrupts, strip it out..
                            var finance = jQuery(dommer).find('#finance').text();
                            price = price.replace(finance, '');

                            details = jQuery(dommer).find('#smi_prop_type').text();
                            photo = jQuery(dommer).find('.p1 img').attr('src');

                           // If we haven't gotten an address, chances are this is a dead page/non-previewable
                            if(address.length > 0)
                            {
                                var A='<div class=\'twitpic\'><strong><a class="inline-media-image" href="'+srcUrl+'" target="_blank">'+address+'</a><strong><br />'+details+', '+price+'<br /><a class="inline-media-image" href="'+srcUrl+'" target="_blank"><img src=\''+photo+'\' /></a></div>';
                                jQuery(B, doc).append(window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.supplant(A,dt));
                            }
                        }
                    });
                }
            });

            // Adverts.ie SMI
            window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.mediaType('twttr.media.types.Adverts',
                    {icon:'photo'
                    ,domain:'http://www.adverts.ie/'
                    ,matchers:{media:/adverts.ie\/([a-zA-Z0-9\.\/\?\-\_\=]+)/g}
                    ,process:function(A){
                        this.data.src=this.slug;
                        this.data.name=this.constructor._name;
                        A()
                    }
                    ,render:function(B) {
                        var title = '';
                        var price = '';
                        var photo = '';

                        var dt = this.data;

                        var srcUrl = 'http://www.adverts.ie/'+this.slug;
						jQuery.ajax({
                            url: srcUrl,
                            success: function(d) {
                                var dommer = HTMLParser(d);
                                title = jQuery(dommer).find('.title h1').text();

                                details = jQuery(dommer).find('.price dd').text();

                                // Get rid of extra html string
                                details = details.replace('Make an offer\/Ask a question', '');
                                photo = jQuery(dommer).find('.p1 img').attr('src');
                                // If we haven't gotten a title, chances are this is a dead page/non-previewable
                                if(title.length > 0)
                                {
                                    var A='<div class=\'twitpic\'><strong><a class="inline-media-image" href="'+srcUrl+'" target="_blank">'+title+'</a><strong><br />'+details+'<br /><a class="inline-media-image" href="'+srcUrl+'" target="_blank"><img src="'+photo+'" /></a></div>';
                                    jQuery(B, doc).append(window.top.getBrowser().selectedBrowser.contentWindow.wrappedJSObject.twttr.supplant(A,dt));
                                }
                            }
                        });
                    }
                }
            );}
        };
    }();

/**
 * This handy number lets us get a usable DOM from a full html page (aHTMLString)
 */
function HTMLParser(aHTMLString){
  var html = document.implementation.createDocument("http://www.w3.org/1999/xhtml", "html", null),
    body = document.createElementNS("http://www.w3.org/1999/xhtml", "body");
  html.documentElement.appendChild(body);

  body.appendChild(Components.classes["@mozilla.org/feed-unescapehtml;1"]
    .getService(Components.interfaces.nsIScriptableUnescapeHTML)
    .parseFragment(aHTMLString, false, null, body));

  return body;
}

window.addEventListener("load", twitterMediaPreview.init, false);