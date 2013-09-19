var ecollution = angular.module('ecollution', ["google-maps", "angles"]);

// Proxy function required to call Angular method from link's onclick attribute (infowindow)
proxy = function(id) {
  angular.element(document.getElementById("application")).scope().selectStation(id)
}

ecollution.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {


  // ***********************************
  // Initial state declaration
  // ***********************************

  $scope.chartOptions = {
    scaleFontSize : 10,
    pointDot : false,
    datasetStrokeWidth : 1,
    scaleLineColor : "rgba(155,155,155,1)",
    scaleLineWidth : 1,
    scaleFontColor : "#000",
    datasetFill : false,
  };
  
  $scope.chart = {
      labels : [],
      datasets : [
          { strokeColor : "#ff0000", data : [] },
          { strokeColor : "#0000ff", data : [] }
      ], 
  };
  
  $scope.substanceDefinitions = [
    {id: "CO", name: "CO"}, {id: "H", name: "H"}, {id: "H2S", name: "H2S"}, {id: "NH3", name: "NH3"},
    {id: "NO", name: "NO"}, {id: "NO2", name: "NO2"}, {id: "O3", name: "O3"}, {id: "P", name: "P"},
    {id: "SO2", name: "SO2"}, {id: "Summa_CH", name: "\u0421\u0443\u043c\u043c\u0430 CH"}, {id: "T", name: "T"},
    {id: "V", name: "V"}, {id: "ba2", name: "Ba2+"}, {id: "ca2", name: "Ca2+"}, {id: "cl", name: "Cl-"},
    {id: "eh", name: "Eh"}, {id: "epv", name: "\u042d\u041f\u0412"}, {id: "epv-hor", name: "\u042d\u041f\u0412-Hor"},
    {id: "f", name: "F-"}, {id: "k", name: "K+"}, {id: "mutnost", name: "\u041c\u0443\u0442\u043d\u043e\u0441\u0442\u044c"},
    {id: "n(nh4)", name: "N(NH4)"}, {id: "n(no3)", name: "N(NO3)"}, {id: "o2rastv", name: "\u041e2 (\u0440\u0430\u0441\u0442\u0432)"},
    {id: "ph", name: "pH"}, {id: "ph-hor", name: "pH-Hor"},
    {id: "photometr", name: "\u0424\u043e\u0442\u043e\u043c\u0435\u0442\u0440"}, {id: "sac254", name: "SAC254"},
    {id: "sumpau", name: "\u0421\u0443\u043c \u041f\u0410\u0423"}, {id: "t", name: "T"}
  ]

  angular.extend($scope, {
    center: { latitude: 0, longitude: 0},
    stations: [],
    markers: [],
    zoom: 8,
  });

  $scope.timestamps = [];
  for (var i=0; i < 365; i++) { 
    var today = new Date(), day = new Date(today.getTime() - i*(24 * 60 * 60 * 1000));
    $scope.timestamps.push({
      name: day.getDate().toString() + '/' + day.getMonth().toString() + '/' + day.getFullYear().toString(),
      id: (day.setHours(0,0,0,0) / 1000).toFixed()
    })
  };

  // Get all of stations, acrooss application
  $http.get('samples/getall.json').success(function(data){
    
    // Extend each station with infoWindow partial
    $scope.stations = _.map(data, function(station){
      station.infoWindow = '<h5>' + station.name + '</h5><br><a onclick="proxy(\'' + station.id + '\')">Подробно</a>';
      return station;
    });
    
    // Extract cities from stations array
    $scope.cities = _.inject(data, function(memo, station){
      if (_.where(memo, {id: station.city_id}).length == 0) {
        memo.push({ id: station.city_id, name: station.city_name })
      } return memo
    }, []);
    
    // Initial state
    $scope.cities.unshift({id: 'all', name: 'Все города'});
    $scope.selectedCity = $scope.cities[0];
  });


  // **********************
  // There are methods goes
  // **********************

  $scope.classUnless = function(k,c){ return c ? '' : k };

  $scope.classIf = function(k,c){ return c ? k : '' };
  
  // Select station by id (required for proxy call from map infoWindow)
  $scope.selectStation = function(id) { $scope.$apply(function(){
    $scope.selectedStation = _.where($scope.stations, {id: id})[0];
  })};
  
  // Select station by type
  $scope.typeStations = function(type) {
    return _.where($scope.stations, {type: type})
  }

  // Select station by city
  $scope.cityStations = function(city) {
    if (city) {
      if (city.id == "all") return $scope.stations
      return _.where($scope.stations, {id: "all"}).concat(_.where($scope.stations, {city_id: city.id}))
    }
  }

  // Call for chart data
  $scope.drawChart = function() {
    var subId = $scope.selectedSubstance.id, tsFrom = $scope.chartPeriodFrom.id, tsTo = $scope.chartPeriodTo.id, stationId = $scope.selectedStation.id
    var url = 'samples/' + subId + '-pidf' + stationId + '-time_from' + tsFrom + '-time_to' + tsTo + '-freqh.json'

    $http.get(url).success(function(data){
      $scope.chart.labels = _.map(data, function(reading){ return reading.label });
      $scope.chart.datasets[0].data = _.map(data, function(reading){ return parseFloat(reading.pdk) });
      $scope.chart.datasets[1].data = _.map(data, function(reading){ return parseFloat(reading.value) });
    }).error(function(data){
      $scope.chart.labels = [];
      $scope.chart.datasets[0].data = [];
      $scope.chart.datasets[1].data = [];
    });    
  };

  
  // ***********************
  // There are watchers goes
  // ***********************
  
  $scope.$watch('selectedCity', function(newCity, oldCity) {
    if (newCity) {
      if (newCity.id == "all") {
        $scope.markers = $scope.stations
      } else {
        $scope.markers = _.where($scope.stations, {city_id: newCity.id});
      }
      $scope.selectedStation = null;
    }
  });
  
  
  // Center map if only one marker on it (map with many centered automatically)
  $scope.$watch('markers', function(newMarkers, oldMarkers) {
    if (newMarkers.length == 1) {
      $scope.center = {latitude: newMarkers[0].latitude, longitude: newMarkers[0].longitude};
    }
  });
  
  
  $scope.$watch('selectedStation', function(newStation, oldStation) {
    if (newStation) {
      $scope.markers = [newStation];
      
      // reset right sidebar state
      $scope.tab = 'table';
      $scope.chart.labels = [];
      $scope.chart.datasets[0].data = [];
      $scope.chart.datasets[1].data = [];
      $scope.drawChart();
      
      $http.get('samples/current/' + newStation.id + '.json').success(function(data){
        $scope.selectedStationData = data;
      });
    }
  });
  
  $scope.$watch('selectedSubstance', $scope.drawChart);
  $scope.$watch('chartPeriodFrom', $scope.drawChart);
  $scope.$watch('chartPeriodTo', $scope.drawChart);

}]);