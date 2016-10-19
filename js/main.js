// Constructor funciton to turn model data into Brewery objects
var Brewery = function(data) {
  var self = this;
  self.name = ko.observable(data.name);
  self.address = ko.observable(data.address);
  self.latLng = ko.observable(new google.maps.LatLng(data.lat, data.lng));
  self.yelpID = ko.observable(data.yelpID);
  self.foursquareID = ko.observable(data.foursquareID);

  // Create markers, but don't set them on the map yet
  self.marker = new google.maps.Marker({
      position: self.latLng(),
      map: null,
      title: self.name()
  });

  // Function to display or hide the marker
  // Nested if statements to avoid markers flickering on each keystroke
  self.toggleMarker = function(value) {
    if (value === map) {
      if (self.marker.map === null) {
        self.marker.setMap(map);
      }
    } else {
      self.marker.setMap(null);
    }
  };
};

// Make the map!
var map = new google.maps.Map(document.getElementById('google_map'), {
    zoom: 12,
    center: {
      lat: 39.845679452282155,
      lng: -86.16081458203126
    }
});

// hide and show the list of places in mobile view
var shown = false;
$('#ham').click(function() {
  if (shown == false) {
    $('#right').animate({ left: 250 }, 'slow');
    shown = true;
  } else {
    $('#right').animate({ left: 0 }, 'slow');
    shown = false;
  }
});

// Get the default InfoWindow content ready
// There is only one InfoWindow, and it's content changes based on which brewery is clicked
var infoWindowContent =
  "<div id='infowindow' class='infowindow'>" +
    "<h2 id='iwName' class='iwName'></h2>" +
    "<div id='iwYelp' class='rating'>" +
      "<img src='img/yelp-logo.png' alt='The Yelp Logo' />" +
      "<p>Rating: </p>" +
      "<img id='yelpRating' src='img/loading.gif' />" +
    "</div>" +
    "<div id='iwFoursquare' class='rating'>" +
      "<img src ='img/foursquare-logo.png' alt='The Foursquare Logo' />" +
      "<span id='foursquareRating'>" +
        "<img src='img/loading.gif' />" +
      "</span>" +
    "</div>" +
  "</div>";

// All the important stuff happens in here
var ViewModel = function() {
  var self = this;

  self.searchString = ko.observable('');

  // This array will hold all of the brewery objects
  self.locations = ko.observableArray([]);
  breweries.forEach(function(breweryData) {
    self.locations.push(new Brewery(breweryData));
  });

  // Add a click handler to each marker.
  // Can maybe be combined into the locations array creator.
  self.locations().forEach(function(brewery) {
    google.maps.event.addListener(brewery.marker, 'click', function() {
      self.handleClick(brewery);
    });
  });

  // Determine which locations to display based on the user's search
  // This is an array that is a computed observable, but it's NOT an _observable_ array
  self.filteredLocations = ko.computed(function() {
    var searchedBreweries = [],
        locationLength = self.locations().length;

    for (i = 0; i < locationLength; i++) {
        if (self.locations()[i].name().toLowerCase().indexOf(self.searchString().toLowerCase()) != -1) {
          searchedBreweries.push(self.locations()[i]);
          self.locations()[i].toggleMarker(map);
        } else {
          self.locations()[i].toggleMarker();
        }
    }
    // Array must be sorted here because it's not an observable array
    return searchedBreweries.sort(function (l, r) { return l.name() > r.name() ? 1 : -1;});
  });

  // Create one infowindow object that will be opened at various locations and have its contents changed
  self.infowindow = new google.maps.InfoWindow();
  self.infowindow.setContent(infoWindowContent);

  // All kinds of stuff needs to happen when a marker or list item is clicked on
  self.handleClick = function(brewery) {
    // Zoom in, center, and bounce the marker
    map.setZoom(14);
    map.setCenter(brewery.latLng());
    brewery.marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ brewery.marker.setAnimation(null); }, 750);
    // Async calls to get brewery ratings
    self.getYelpInfo(brewery);
    self.getFoursquareInfo(brewery);
    // Open the InfoWindow on the associated marker
    self.infowindow.open(map, brewery.marker);
    $('#iwName').text(brewery.name());
    if (shown == true) {
      $('#right').animate({ left: 0 }, 'slow');
      shown = false;}
  };

  // Get that Yelp info!
  self.getYelpInfo = function(brewery) {
    // Set rating to a loading gif
    $('#yelpRating').attr("src", 'img/loading.gif');

    // The rest of this is getting ready for and then doing the ajax call
    var httpMethod = 'GET';
    var builtURL = 'http://api.yelp.com/v2/business/' + brewery.yelpID();

    // vvv Everything from here vvvv
    var nonceMaker =  function() {
        return (Math.floor(Math.random() * 1e12).toString());
    };

    var parameters =
        {
            oauth_consumer_key : '6FZQD1_YWvn2MNTmlYBVNQ',
            oauth_token : 'j8iHnHl6tE2kRly_vOnxXZHYQZfIsIXR',
            oauth_nonce : nonceMaker(),
            oauth_timestamp : Math.floor(Date.now()/1000),
            oauth_signature_method : 'HMAC-SHA1',
            oauth_version : '1.0',
            callback: 'callback'
        };

    var consumerSecret = 'Z81s01xE4T2x20quzxj25luAQYM';
    var tokenSecret = 'URYmHl-hsdjCSq3TtzGkO9Hu350';

    var encodedSignature = oauthSignature.generate(httpMethod, builtURL, parameters, consumerSecret, tokenSecret);
    parameters.oauth_signature = encodedSignature;
    // ^^^^ to here ^^^^ is for oauth.
    // oauth really isn't supposed to be used like this, so this is an insecure and bad workaround
    // that relies on a 3rd party library to work.


    // creat the settings object for the ajax call
    var settings = {
      url: builtURL,
      data: parameters,
      cache: true,
      dataType: 'jsonp',
      // If it works, grab the Yelp rating image url and put it in the InfoWindow!
      success: function(results) {
        $('#yelpRating').attr("src", results.rating_img_url);
      }
      // Where is the error handler, you ask?
      // It's the loading gif!
      // JSONP doesn't play well with errors
      // You COULD set a timeout function that changes the loading gif to 'failed to load' or something
      // after like 5 or 10 seconds...
      // But I don't like that idea
    };

    // Holy smokes, we finally make the ajax call here
    $.ajax(settings);
  };

  // Get that Foursquare info!
  self.getFoursquareInfo = function(brewery) {
    // Loading gif!
    $('#foursquareRating').html('<img src="img/loading.gif" />');

    // This is so much easier than oauth...
    var d = new Date();
    var foursquareDate = d.getFullYear().toString() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
    var foursquareClientID = 'YH1RZFX1LIWV00KWMBE4IAMQAMRRIWUY2VBW5ERBQ0O0BWUP';

    // but it's still not exactly secure.
    // Once I'm done with the final project,
    // I'm gonna figure out how do this serverside using node.js
    var foursquareClientSecret = 'OHZQMS0ZWF0WC0NY5TPTMZLKUSLT2PATBTLSLN2OPMXFIVLB';

    var builtURL = 'https://api.foursquare.com/v2/venues/' + brewery.foursquareID() + '?&client_id=' + foursquareClientID + '&client_secret=' + foursquareClientSecret + '&v=' + foursquareDate;

    // Create settings object for ajax call
    var settings = {
      url: builtURL,
      // Foursquare has a minimum number of reviews before it actually assigns a rating,
      // so you have to catch that or else it displays an ugly error
      success: function(results) {
        if (results.response.venue.rating) {
          $('#foursquareRating').html('<p>Rating: ' + results.response.venue.rating + ' out of 10 based on ' + results.response.venue.ratingSignals + ' ratings!</p>');
        } else {
          $('#foursquareRating').html('<p>Not enough ratings! Why don\'t you go there, have some beers, and rate it?!</p>');
        }
      }
      // No dedicated error handler cause I'm just using the loading gif
    };

    // The actuall ajax call!
    $.ajax(settings);

  };
};

// Gotta apply the bindings or nothing happens!
ko.applyBindings( new ViewModel() );
