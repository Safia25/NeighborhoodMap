// Set global variables
var map,
    defaultIcon,
    largeInfowindow,
    vm;

// Create a new blank array for all the listing markers.
var markers = [];

// Fallback if Google Maps fails to load
function googleError() {
    "use strict";
    document.getElementById('map').innerHTML = "<h2>Looks like something went wrong. Please refresh the page.</h2>";
}




///Knockout is designed to allow you to use arbitrary JavaScript objects as view models. 
///As long as some of your view model’s properties are observables, 
///you can use KO to bind to them to your UI, and the UI will be updated automatically 
///whenever the observable properties change.
///Turn model info into observables 
var Restaurant = function(info) {
    var self = this;
    self.title = ko.observable(info.title);
    self.location = ko.observable(info.location);
    self.yelp = ko.observable(info.yelp);

    //Create corresponding map markers that will display when filtered
    self.marker = new google.maps.Marker({
        position: self.location(),
        title: self.title(),
        yelp: self.yelp(),
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        map: map
    });

    // Marker click event listener
    self.marker.addListener('click', function() {
        // Call the 'handleClick' function within the viewModel, and pass this Restaurant object as the parameter
        vm.handleClick(self);
    });

};

var myViewModel = function() {
    var self = this;

    self.locations = ko.observableArray();

    restaurants.forEach(function(item) {
        var restaurant = new Restaurant(item);

        self.locations.push(restaurant);
    });

    self.selectedfilter = ko.observable("");

    //Filter the restaurants array
    ///Allow a user to filter the list of items by name. 
    //Create a computed observable that returns the matching subset of the original array of items. 
    self.filteredlocations = ko.computed(function() {
        var filter = self.selectedfilter().toLowerCase();
        if (!filter) {
            self.locations().forEach(function(loc) {
                loc.marker.setVisible(true);
            });
            return self.locations();
        } else {
            return ko.utils.arrayFilter(self.locations(), function(loc) {
                //console.log(loc);
                //return ko.utils.stringStartsWith(loc.title().toLowerCase(), filter);
                //return loc.title().toLowerCase().indexOf(filter) !== -1;

                if (loc.title().toLowerCase().indexOf(filter) !== -1) {
                    loc.marker.setVisible(true);
                    return true;
                } else {
                    console.log('hiding marker');
                    loc.marker.setVisible(false);
                    return false;
                }
            });

        }
    });

    self.handleClick = function(loc) {
        function nonce_generate() {
            return (Math.floor(Math.random() * 1e12).toString());
        }

        if (loc.marker.getAnimation() !== null) {
         loc.marker.setAnimation(null);
        } else {
        loc.marker.setAnimation(google.maps.Animation.BOUNCE);
}

        var yelp_url = 'http://api.yelp.com/v2/business/' + loc.yelp();
        console.log(yelp_url);

        var parameters = {
            oauth_consumer_key: 'NY5nJV-s7-ewCyxQG27zuA',
            oauth_token: 'Xtcd_YG7Rih_DNxw2umzzzlyC-81uHQV',
            oauth_nonce: nonce_generate(),
            oauth_timestamp: Math.floor(Date.now() / 1000),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_version: '1.0',
            callback: 'cb' // This is crucial to include for jsonp implementation in AJAX or else the oauth-signature will be wrong.
        };

        var encodedSignature = oauthSignature.generate('GET', yelp_url, parameters, '3CH3nupVMEz1zYe0qj4Rh4Ei4KY', 'Vm7ErCmaC6UirITgDSATaNZNgiA');
        parameters.oauth_signature = encodedSignature;

        var settings = {
            url: yelp_url,
            data: parameters,
            cache: true, // This is crucial to include as well to prevent jQuery from adding on a cache-buster parameter "_=23489489749837", invalidating our oauth-signature
            dataType: 'jsonp'
        };


        // Send AJAX query via jQuery library.
        $.ajax(settings)

        .done(function(results) {

            //$('#yelpRating').attr("src", results.rating_img_url)
            var content = "<img src='" + results.rating_img_url + "'>" + results.name;
            largeInfowindow.setContent(content);
            largeInfowindow.open(map, loc.marker);
        })

        .fail(function(error) {
            largeInfowindow.setContent("<h2>There is a problem. Please refresh the page.</h2>");
            largeInfowindow.open(map, loc.marker);
        })
    };
};

function initMap() {

    // Create a styles array to use with the map.
    var styles = [{
        featureType: 'water',
        stylers: [{
            color: '#19a0d8'
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [{
            color: '#ffffff'
        }, {
            weight: 6
        }]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [{
            color: '#e85113'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{
            color: '#efe9e4'
        }, {
            lightness: -40
        }]
    }, {
        featureType: 'transit.station',
        stylers: [{
            weight: 9
        }, {
            hue: '#e85113'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [{
            visibility: 'off'
        }]
    }, {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{
            lightness: 100
        }]
    }, {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{
            lightness: -100
        }]
    }, {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{
            visibility: 'on'
        }, {
            color: '#f0e4d3'
        }]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{
            color: '#efe9e4'
        }, {
            lightness: -25
        }]
    }];




    // Constructor creates a new map 
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 34.033512,
            lng: -118.463038
        },
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // This autocomplete is for use in the geocoder entry box.
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    //Bias the boundaries within the map for the zoom to area text.
    zoomAutocomplete.bindTo('bounds', map);

    largeInfowindow = new google.maps.InfoWindow();

    // Style the markers 
    defaultIcon = makeMarkerIcon('0091ff');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');

    // Store the ViewModel object inside a global variable
    vm = new myViewModel();
    // Apply bindings to vm object
    ko.applyBindings(vm);

    document.getElementById('zoom-to-area').addEventListener('click', function() {
        zoomToArea();
    });
}



// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

//Open the hamburger menu when clicked
var menu = document.querySelector('#menu');
var main = document.querySelector('main');
var drawer = document.querySelector('#map');


menu.addEventListener('click', function(e) {
  drawer.classList.toggle('open');
  e.stopPropagation();
});
main.addEventListener('click', function() {
    drawer.classList.remove('open');
});

// This function takes the input value in the find nearby area text input
// locates it, and then zooms into that area. This is so that the user can
// show all listings, then decide to focus on one area of the map.
function zoomToArea() {
    // Initialize the geocoder.
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = document.getElementById('zoom-to-area-text').value;
    // Make sure the address isn't blank.
    if (address === '') {
        window.alert('You must enter an area, or address.');
    } else {
        // Geocode the address/area entered to get the center. Then, center the map
        // on it and zoom in
        geocoder.geocode({
            address: address,
            componentRestrictions: {
                locality: 'Los Angeles'
            }
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
            } else {
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
            }
        });
    }
}