///Knockout is designed to allow you to use arbitrary JavaScript objects as view models. 
///As long as some of your view model’s properties are observables, 
///you can use KO to bind to them to your UI, and the UI will be updated automatically 
///whenever the observable properties change.


///Turn model info into observables (right?)

var Restaurant = function(info) {
	var self = this;
	self.title = ko.observable(info.title);
	self.location = ko.observable(info.location);


	//Create corresponding map markers that will display when filtered
	self.marker = new google.maps.Marker({
	position: location,
    title: title,
    animation: google.maps.Animation.DROP,
    icon: defaultIcon,
    id: i,
    map: null
       });
};

var myViewModel = function() {
	var self = this;

///Bind to view 
self.selectedfilter = ko.observable('');
}


//Filter the restaurants array
///Allow a user to filter the list of items by name. 
//Create a computed observable that returns the matching subset of the original array of items. 
self.filteredItems = ko.computed(function() {
    var filter = this.filter().toLowerCase();
    if (!filter) {
        return this.items();
    } else {
        return ko.utils.arrayFilter(this.items(), function(item) {
            return ko.utils.stringStartsWith(item.name().toLowerCase(), filter);
        });
    }
}, viewModel);

///Activate Knockout
ko.applyBindings(myViewModel);