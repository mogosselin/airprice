//! Airprice Chrome extension
//! version : 0.1
//! authors : Marc-Olivier Gosselin
//! license : MIT
//! mogosselin.com

if(window.location.href.indexOf(".airbnb.") > -1 && window.location.href.indexOf("/s/") > -1 ) {

    $(document).ready(function() {
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
        $('#currency-selector').each(function() {
            if ($(this).val().length == 3) {
                currency  = $.trim($(this).val());
                return false;
            }
        });

        var check_in = '';
        var check_in_price_format = '';
        var check_out = '';
        var check_out_price_format = '';
        var guests = '1';


        $('[class*=listingCardWrapper]:first').each(function() {
            var url = $(this).find('[class^=anchor_]').attr('href');
            var urlParams = new URLSearchParams(url.split('?')[1]);
            var paramguests = urlParams.get('guests');

            check_in = urlParams.get('checkin');
            check_out = urlParams.get('checkout');
            guests = paramguests == undefined ? 1 : paramguests;

            // number_of_adults = getVal(url, '&adults=', '&children=');
            // number_of_children = getVal(url, '&children=', '&infants=');
            // number_of_infants = url.substring(url.indexOf('&infants=') + 9);

            var date_format = "D MMM";

            var dates = $('[class^=dateRange_]').text().split(' – ');

            check_in_price_format = moment(dates[0], date_format).format('YYYY-MM-DD');
            check_out_price_format = moment(dates[1], date_format).format('YYYY-MM-DD');

        });

        $('body').prepend('<div id="airtotal" style="width: 100%; display: none; position: absolute; background: #F0F0F0; padding: 10px; z-index: 11;"><div id="airtotal-close"><a href="#">[Close]</a></div></div>')
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
                    html += '<span style="position:absolute; margin-top:-20px; color: white; background-color: rgba(45,45,45,0.9);">' + addCommas(room.price) + '<sup>' + currency + '</sup>';
                    html += '</a>';
                html += '</div>';
                html += '<div><a href="' + room.url + '">' + room.name + instantBookable + '</a></div>';
                html += '<div class="text-muted text-truncate listing-location" style="font-size: 12px;">' + room.city + ' · ' + room.roomType + ' · ' + stars + ' · ' + room.nbReviews + ' reviews' + '</div>';

                if (room.discount.length > 0) {
                    html += '<div style="font-size: 10px; font-color: #ff0000; font-style: italic">' + room.discount + '</div>';
                }

                html += '<div>';
                html += '<a target="_blank" href="https://maps.google.com/?q=' + room.lat + ',' + room.lng + '">Map link</a>';

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
            var lat = searchResults.listing.lat;
            var lng = searchResults.listing.lng;
            var city = searchResults.listing.localized_city;
            // var dailyPrice = searchResults.pricing_quote.rate.amount;
            // no longer returned

            var priceUrl = domain + "/api/v2/pricing_quotes?guests=" + guests + "&listing_id=" + listing_id + "&_format=for_detailed_booking_info_on_web_p3_with_message_data&_interaction_type=pageload&_intents=p3_book_it&show_smart_promotion=0&check_in=" + check_in_price_format + "&check_out=" + check_out_price_format + "&key=" + key + "&currency=" + currency + "&locale=en-US";

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

                var url = '/rooms/' + listing_id +'?checkin=' + check_in + '&checkout=' + check_out + '&guests=' + guests + '&adults=';
                var room = {price: totalPrice, discount: discount, name: name, url: url, image: image, nbReviews: nbReviews, starRating: starRating, roomType: roomType, instantBookable: instantBookable, lat: lat, lng: lng, city: city};
                addRoom(room);

            })
            .fail(function() { console.log("error"); });

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

            var nbPages = parseInt($('nav[role=navigation]').find('ul').eq(0).find('li:last-child').prev().text());

            if (isNaN(nbPages)) {
                nbPages = 1;
            }

            var metaUrl = $('meta[property="al:ios:url"]').attr('content');
            metaUrl = metaUrl.replace('check_in', 'checkin');
            metaUrl = metaUrl.replace('check_out', 'checkout');
            var searchParams = '?' + metaUrl.substring(18) + '&location=' + $('.copy_14aozyc').eq(0).text();
            searchParams = decodeURIComponent(searchParams);
            searchParams = new URLSearchParams(searchParams);

            var checkinVal = searchParams.get('checkin');
            var checkoutVal = searchParams.get('checkout');;

            var checkinArr = checkinVal.split('/');
            var checkoutArr = checkoutVal.split('/');

            var newCheckinVal = checkinArr[2] + '-' + checkinArr[1] + '-' + checkinArr[0];
            var newCheckoutVal = checkoutArr[2] + '-' + checkoutArr[1] + '-' + checkoutArr[0];
            searchParams.set('checkin', newCheckinVal);
            searchParams.set('checkout', newCheckoutVal);

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

            var currentUrl = new URLSearchParams(window.location.search);
            for (var i=0; i<paramNames.length; i++) {
                // Merge any current search terms
                paramVal = currentUrl.get(paramNames[i]);
                if (paramVal !== null) {
                    searchParams.set(paramNames[i], paramVal);
                }
            }

            var urls = [nbPages-1];
            for (var i=0; i<nbPages; i++) {
                var newUrl = searchParams;
                newUrl.set('page', i+1);
                urls[i] = "search/search_results?" + newUrl.toString();
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

        $('.search-results:not(.loading)').before('<div style="text-align:center; margin: 10px auto;"><a id="get-listing" style="display: inline-block; padding: 10px; color: white; background: #008489; border-radius: 6px;" href="#">Get all listings...</a></div>');
        $('#get-listing').click(function() {
            getListings();
        });

    });
}