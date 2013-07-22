var Bookmarks = angular.module('Bookmarks', []);

Bookmarks.config(['$routeProvider', function($routeProvider){
  $routeProvider.when('/signup', {templateUrl: '/static/signup.htm', controller: 'RouteController'});
  $routeProvider.when('/login', {templateUrl: '/static/login.htm', controller: 'RouteController'});
}]);

function AppController($scope){
}

function RouteController($route, $routeParams){
}
