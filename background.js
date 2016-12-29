//! Airprice Chrome extension
//! version : 0.1
//! authors : Marc-Olivier Gosselin
//! license : MIT
//! mogosselin.com

if(window.location.href.indexOf(".airbnb.") > -1 && window.location.href.indexOf("/s/") > -1 ) {

    $(document).ready(function() {
        getVal = function(str, start, end) {
            var startPos = str.indexOf(start);
            var endPos = str.indexOf(end);

            if (end == '') {
                endPos = str.length;
            }

            var val = '';
            val = str.substring(startPos + start.length, endPos);
            return val;
        };

        getMonth = function(date) {
          var month = date.getMonth() + 1;
          return month < 10 ? '0' + month : '' + month; // ('' + month) for string result
        };

        var domain = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');

        var meta = $( "meta[content*='\"key\":\"']" ).attr('content');

        var startOf = meta.indexOf('"key":"');
        var key = meta.substring(startOf);
        var endOf = key.indexOf('"},"');
        key = key.substring(7, endOf);

        var currency = '???';
        $('sup[class="currency-code"]').each(function() {
            if ($(this).html().length == 4) {
                currency  = $.trim($(this).html());
                return false;
            }
        });

        var check_in = '';
        var check_in_price_format = '';
        var check_out = '';
        var check_out_price_format = '';
        var guests = '';
        var number_of_adults = '';
        var number_of_children = '';
        var number_of_infants = '';


        $('.listing-card-wrapper:first').each(function() {
            var url = $(this).find('.media-photo').attr('href');

            check_in = decodeURIComponent(getVal(url, '?checkin=', '&checkout='));
            check_out = decodeURIComponent(getVal(url, '&checkout=', '&guests='));
            guests = getVal(url, '&guests=', '&adults=');
            number_of_adults = getVal(url, '&adults=', '&children=');
            number_of_children = getVal(url, '&children=', '&infants=');
            number_of_infants = url.substring(url.indexOf('&infants=') + 9);

            var date_format = $('#datespan-checkin-description').html().substring(39).toUpperCase();

            check_in_price_format = moment($('#datespan-checkin').val().toUpperCase(), date_format).format('YYYY-MM-DD');
            check_out_price_format = moment($('#datespan-checkout').val().toUpperCase(), date_format).format('YYYY-MM-DD');

        });

        $('body').append('<div id="airtotal" style="width: 100%; display: none; position: absolute; background: #F0F0F0; padding: 10px; z-index: 11;"><div id="airtotal-close"><a href="javascript: void();">[Close]</a></div></div>')
        $('#airtotal-close').click(function() {
            $('#airtotal').css('display', 'none');
        });

        addCommas = function(nStr) {
            nStr += '';
            x = nStr.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? '.' + x[1] : '';
            var rgx = /(\d+)(\d{3})/;
            while (rgx.test(x1)) {
                x1 = x1.replace(rgx, '$1' + ',' + '$2');
            }
            return x1 + x2;
        };

        updatePrices = function() {
            $('.listing-card-wrapper').each(function() {
                var url = $(this).find('.media-photo').attr('href');

                var listing_id = getVal(url, '/rooms/', '?checkin=');
                var check_in = getVal(url, '?checkin=', '&checkout=');
                var check_out = getVal(url, '&checkout=', '&guests=');
                var guests = getVal(url, '&guests=', '&adults=');
                var number_of_adults = getVal(url, '&adults=', '&children=');
                var number_of_children = getVal(url, '&children=', '&infants=');
                var number_of_infants = url.substring(url.indexOf('&infants=') + 9);

                check_in = check_in.split('-');
                check_in = check_in[2] + '-' + check_in[1] + '-' + check_in[0];

                check_out = check_out.split('-');
                check_out = check_out[2] + '-' + check_out[1] + '-' + check_out[0];

                var priceUrl = domain + "/api/v2/pricing_quotes?guests=" + guests + "&listing_id=" + listing_id + "&_format=for_detailed_booking_info_on_web_p3_with_message_data&_interaction_type=pageload&_intents=p3_book_it&show_smart_promotion=0&check_in=" + check_in + "&check_out=" + check_out + "&number_of_adults=" + number_of_adults + "&number_of_children=" + number_of_children + "&number_of_infants=" + number_of_infants + "&launchInfantsV2=true&key=" + key + "&currency=" + currency + "&locale=en-US";

                $.getJSON( priceUrl, function( data ) {
                    var totalPrice = data.pricing_quotes[0].price.total.amount;
                    var currentPrice = $('a[href="' + url + '"]').parent().find('span.price-amount').html();
                    currentPrice = currentPrice + ' (' + addCommas(totalPrice) + ' total)';
                    $('a[href="' + url + '"]').parent().find('span.price-amount').html(currentPrice);
                });

                $(this).removeClass('listing-card-wrapper');

            });
        };

        updatePricesLoop = function() {
            updatePrices();
            setTimeout(function () {
                updatePricesLoop();
            }, 1000);
        };

        addRoom = function(room) {
            var instantBookable = '';

            if (room.instantBookable) {
                instantBookable = ' <i class="icon icon-instant-book icon-flush-sides icon-beach"></i>';
            }

            var stars = '';

            nbStars = parseInt(room.starRating);
            for (var i=0; i<nbStars; i++) {
                stars += '<i class="icon-star icon icon-babu icon-star-big"></i> ';
            }

            if (nbStars != room.starRating) {
                stars += '<i class="icon-star-half icon icon-babu icon-star-big"></i>';
            }

            var html = '<div class="listing" style="height: 300px; padding-bottom: 10px; margin:10px; float: left; width: 300px;" data-price="' + room.price + '">';
                html += '<div>';
                    html += '<a href="' + room.url + '">';
                    html += '<div style="max-height: 200px; overflow: hidden;"><img style="width: 300px; height: auto;" src="' + room.image + '"></div>';
                    html += '<span style="position:absolute; margin-top:-20px; color: white; background-color: rgba(45,45,45,0.9);">' + addCommas(room.price) + '<sup>' + currency + '</sup> <span style="font-size: 10px;">(' + room.dailyPrice + ' daily)<span></span>';
                    html += '</a>';
                html += '</div>';
                html += '<div><a href="' + room.url + '">' + room.name + instantBookable + '</a></div>';
                html += '<div class="text-muted text-truncate listing-location" style="font-size: 12px;">' + room.roomType + ' · ' + stars + ' · ' + room.nbReviews + ' reviews' + '</div>';

                if (room.discount.length > 0) {
                    html += '<div style="font-size: 10px; font-color: #ff0000; font-style: italic">' + room.discount + '</div>';
                }

            html += '</div>';

            $('#airtotal').append(html);

            $('#airtotal').find('div.listing').sort(function (a, b) {
               return $(a).attr('data-price') - $(b).attr('data-price');
            }).appendTo('#airtotal');

        };

        getFinalResult = function(searchResults) {
            var listing_id = searchResults.listing.id;
            var name = searchResults.listing.name;
            var image = searchResults.listing.picture_url;
            var nbReviews = searchResults.listing.reviews_count;
            var starRating = searchResults.listing.star_rating;
            var roomType = searchResults.listing.room_type;
            var instantBookable = searchResults.listing.instant_bookable;
            var dailyPrice = searchResults.pricing_quote.rate.amount;

            var priceUrl = domain + "/api/v2/pricing_quotes?guests=" + guests + "&listing_id=" + listing_id + "&_format=for_detailed_booking_info_on_web_p3_with_message_data&_interaction_type=pageload&_intents=p3_book_it&show_smart_promotion=0&check_in=" + check_in_price_format + "&check_out=" + check_out_price_format + "&number_of_adults=" + number_of_adults + "&number_of_children=" + number_of_children + "&number_of_infants=" + number_of_infants + "&launchInfantsV2=true&key=" + key + "&currency=" + currency + "&locale=en-US";

            //Establish connection to php script
            $.ajax({
              type: 'GET',
              url: priceUrl
            }).done(function(data) {
                var totalPrice = data.pricing_quotes[0].price.total.amount;
                var discount = '';

                var priceItems = data.pricing_quotes[0].price.price_items;
                for (var i=0; i<priceItems.length; i++) {
                    if (priceItems[i].type == 'DISCOUNT') {
                        discount = priceItems[i].localized_title;
                    }
                }

                var url = '/rooms/' + listing_id +'?checkin=' + check_in + '&checkout=' + check_out + '&guests=' + guests + '&adults=' + number_of_adults + '&children=' + number_of_children + '&infants=' + number_of_infants
                var room = {price: totalPrice, discount: discount, name: name, url: url, image: image, nbReviews: nbReviews, starRating: starRating, roomType: roomType, instantBookable: instantBookable, dailyPrice: dailyPrice};
                addRoom(room);

            })
            .fail(function() { console.log("error"); });

        };

        updateQueryStringParameter = function(uri, key, value) {
          var re = new RegExp("([?&])" + key + "=.*?(&|#|$)", "i");
          if (uri.match(re)) {
            return uri.replace(re, '$1' + key + "=" + value + '$2');
          } else {
            var hash =  '';
            if( uri.indexOf('#') !== -1 ){
                hash = uri.replace(/.*#/, '#');
                uri = uri.replace(/#.*/, '');
            }
            var separator = uri.indexOf('?') !== -1 ? "&" : "?";
            return uri + separator + key + "=" + value + hash;
          }
        };

        getParameterByName = function (name, url) {
            if (!url) {
              url = window.location.href;
            }
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        };

        updateQuerystringValues = function(urlSource, urlTarget, params) {
            for (var i=0; i<params.length; i++) {
                var param = params[i];
                var newValue = getParameterByName(param, urlTarget);

                if (newValue != null) {
                    urlSource = updateQueryStringParameter(urlSource, param, newValue);
                }
            }

            return urlSource;
        };

        removeParameter = function(url, parameter) {
          var urlparts= url.split('?');

          if (urlparts.length>=2)
          {
              var urlBase=urlparts.shift(); //get first part, and remove from array
              var queryString=urlparts.join("?"); //join it back up

              var prefix = encodeURIComponent(parameter)+'=';
              var pars = queryString.split(/[&;]/g);
              for (var i= pars.length; i-->0;)               //reverse iteration as may be destructive
                  if (pars[i].lastIndexOf(prefix, 0)!==-1)   //idiom for string.startsWith
                      pars.splice(i, 1);
              url = urlBase+'?'+pars.join('&');
          }
          return url;
        };

        getListings = function() {
            $('#airtotal').css('display', 'block');
            $('#airtotal div.listing').remove();

            if (!$('#show-current-listing').length) {
                $('#get-listing').after(' - <a id="show-current-listing" href="javascript: void();">Show current listing</a>');
            }

            $('#get-listing').html('Refresh listing');

            $('#show-current-listing').click(function() {
                $('#airtotal').css('display', 'block');
            });

            var nbPages = parseInt($('div.pagination ul.list-unstyled li:last').prev().find('a').html());

            if (isNaN(nbPages)) {
                nbPages = 1;
            }

            var metaUrl = $('meta[property="al:ios:url"]').attr('content');
            metaUrl = metaUrl.replace('check_in', 'checkin');
            metaUrl = metaUrl.replace('check_out', 'checkout');
            var searchParams = '/search/search_results?' + metaUrl.substring(18) + '&location=' + $('#header-search-form').val();
            searchParams = decodeURIComponent(searchParams);

            var checkinVal = getVal(searchParams, '&checkin=', '&checkout=');
            var checkoutVal = getVal(searchParams, '&checkout=', '&children=');

            var checkinArr = checkinVal.split('/');
            var checkoutArr = checkoutVal.split('/');

            var newCheckinVal = checkinArr[2] + '-' + checkinArr[1] + '-' + checkinArr[0];
            var newCheckoutVal = checkoutArr[2] + '-' + checkoutArr[1] + '-' + checkoutArr[0];
            searchParams = searchParams.replace(checkinVal, newCheckinVal);
            searchParams = searchParams.replace(checkoutVal, newCheckoutVal);

            var paramNames = [
                'adults',
                'checkin',
                'checkout',
                'children',
                'guests',
                'hosting_amenities%5B%5D',
                'infants',
                'ne_lat',
                'ne_lng',
                'price_max',
                'room_types%5B%5D',
                'sw_lat',
                'sw_lng',
                'zoom'
            ];

            searchParams = updateQuerystringValues(searchParams, document.URL, paramNames);
            searchParams = removeParameter(searchParams, 'page');

            var urls = [nbPages-1];
            for (var i=0; i<nbPages; i++) {
                urls[i] = searchParams + '&page=' + (i + 1);
            }

            for (var j=0; j<nbPages; j++) {
                $.getJSON( domain + '/' + urls[j], function( data ) {
                    var searchResults = data.results_json.search_results;

                    for (var k = 0; k < searchResults.length; k++) {
                        getFinalResult(searchResults[k]);
                    }

                });
            }

        };

        $('#header .regular-header').after('<div style="border: 1px solid #dce0e0; position: absolute; background-color: #F0F0F0; top:0px; z-index:11; width: 238px;"><a id="get-listing" href="javascript: void();">Get all listings...</a></div>');
        $('#get-listing').click(function() {
            getListings();
        });

    });
}