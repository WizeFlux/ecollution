var ecollution = angular.module('ecollution', ["google-maps"]);

proxy = function(id) {
  angular.element(document.getElementById("application")).scope().runme(id)  
}

ecollution.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {
  angular.extend($scope, {
    center: {
      latitude: 0,
      longitude: 0,
    },
    stations: [],
    markers: [],
    zoom: 8,
  });
  
  $http.get('samples/getall.json').success(function(data){
    $scope.stations = data
    $scope.cities = _.inject(data, function(memo, station){
      if (_.where(memo, {id: station.city_id}).length == 0) {
        memo.push({ id: station.city_id, name: station.city_name })
      }
      return memo
    }, []);
  });
  
  
  $scope.cityStations = function(city) {
    if (city)
      return _.where($scope.stations, {city_id: city.id})
  }
  
  $scope.$watch('selectedCity', function(newCity, oldCity) {
    if (newCity){
      $scope.markers = _.where($scope.stations, {city_id: newCity.id})
      if ($scope.markers.length == 1)
        $scope.center = $scope.markers[0]
    }
      
  });
  
  $scope.$watch('selectedStation', function(newStation, oldStation) {
    if (newStation){
      $scope.markers = [newStation]
      $scope.center = newStation
    }
      
  });
  
}]);