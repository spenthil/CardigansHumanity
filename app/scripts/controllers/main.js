'use strict';

//SEN: minimize bower_components

//SEN: message with invalid cornerRadius etc.
//SEN: optimize for 0 padding - minimize line drawings

//SEN: custom logos
//SEN: detect logo text causing overflow
//SEN: "PICK 2"

angular.module('CardigansHumanityApp')
  .controller('MainCtrl', ['$scope', '$log', '$q', 'cardcard', function ($scope, $log, $q, cardcard) {
    $scope.previewUriString = '';
    $scope.error = '';
    $scope.options = cardcard.options;

    $scope.previewCards = function () {
      cardcard.createUriString($scope.options).then(
        function (uriString) {
          $scope.previewUriString = uriString;
          $scope.error = '';
        },
        function (message) {
          $scope.previewUriString = '';
          $scope.error = message;
        });
    };

    $scope.downloadCards = function () {
      cardcard.createNewWindow($scope.options).then(
        function () { },
        function (message) {
          $scope.previewUriString = '';
          $scope.error = message;
        });
    };

    $scope.previewCards();
  }]);
