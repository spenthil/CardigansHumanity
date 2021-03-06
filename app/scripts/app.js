'use strict';

angular.module('CardigansHumanityApp', [
//    'ngCookies',
//    'ngResource',
//    'ngSanitize',
//    'ngRoute',
    'cardcard'
  ])
  .factory('$exceptionHandler',
    ['$window', '$log',
      function ($window, $log) {
        $log.debug('Using the default logging exception handler.');
        return function () {
          $log.error.apply($log, arguments);
        };
      }
    ]);
