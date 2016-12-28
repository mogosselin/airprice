# AirPrice

AirPrice is a Chrome extension that displays Airbnb search results in a
complete list ordered by price.

* The extension gathers all the results of all the pages based on the current map location
* It will display all the results with the total price for the whole trip (all fees included), so no need to go to the detail page to see the 'real' total.
* The results are displayed by the total price in ascending order (lowest price first)
* The extension also displays if there's any discount for the trip

# Install

This is a work in progress and not quite ready for Google store, so you will have to install the extension in dev mode:

* Download the files of this project and put them somewhere on your drive
* In Chrome, go to chrome://extensions
* Check the 'developer mode' checkbox
* Click on 'Load unpacked extension'
* Choose the folder where the files resides
* And that's it, you should have the extension running

# How to use

* Go to Airbnb
* Do a search for a city/place with a check in and a check out date from the home page
* When the result page is done loading, a link 'Get all listings...' appears at the top left corner
* Move the map where you want to search for accommodations
* Click the 'Get all listings...' link
* A 'popup' should open and start gathering all the different places to rent and put them in order of price
* You can close that popup using the [Close] link
* If you move the map or change the check in or check out date, click on 'Refresh listing'

## If it doesn't work:

* Make sure you selected a city with a check in and a check out date
* Try to refresh the result page (you won't lose your criteria and filters etc)

# Warning

This is a work in progress! The extension is buggy and some features are still not implemented like using filters etc.

Also, the search result page needs to have a place and a check in and check out date selected before loading the result search page, otherwise the extension won't work (refresh the page if that's the case)