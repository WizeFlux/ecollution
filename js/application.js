var ecollution = angular.module('ecollution', ["google-maps"]);

proxy = function(id) {
  angular.element(document.getElementById("application")).scope().selectStation(id)
}

ecollution.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {
  angular.extend($scope, {
    center: {
      latitude: 0,
      longitude: 0
    },
    stations: [],
    markers: [],
    zoom: 8,
  });

  $scope.classUnless = function(k,c){ return c ? '' : k };

  $http.get('samples/getall.json').success(function(data){
    $scope.stations = _.map(data, function(station){
      station.infoWindow = '<h5>' + station.name + '</h5><a onclick="proxy(\'' + station.id + '\')">\u0412\u044B\u0431\u0440\u0430\u0442\u044C</a>';
      station.draggable = false;
      return station;
    });
    
    $scope.cities = _.inject(data, function(memo, station){
      if (_.where(memo, {id: station.city_id}).length == 0) {
        memo.push({ id: station.city_id, name: station.city_name })
      } return memo
    }, []);
  });
  
  
  $scope.selectStation = function(id) {
    $scope.$apply(function(){
      $scope.selectedStation = _.where($scope.stations, {id: id})[0]  
    })
  }
  
  $scope.cityStations = function(city) {
    if (city) return _.where($scope.stations, {city_id: city.id})
  }
  
  $scope.$watch('selectedCity', function(newCity, oldCity) {
    if (newCity) {
      $scope.markers = _.where($scope.stations, {city_id: newCity.id});
      $scope.selectedStation = null;
      if ($scope.markers.length == 1) $scope.center = {
        latitude: $scope.markers[0].latitude, longitude: $scope.markers[0].longitude
      }
    }
  });
  
  $scope.$watch('selectedStation', function(newStation, oldStation) {
    if (newStation) {
      $scope.markers = [newStation];
      $scope.center = { latitude: newStation.latitude, longitude: newStation.longitude };
      
      $http.get('samples/current/' + newStation.id + '.json').success(function(data){
        debugger
        $scope.selectedStationData = data;
      });
      
    }
  });
  
}]);