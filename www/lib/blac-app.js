/**
 * Created by Administrator on 2015/1/15.
 */
var app = angular.module('blacapp', ['ui.router', 'blac-util']);

app.config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/login"); // For any unmatched url, redirect.
  $stateProvider
    .state('login', {
      url: "/login",
      templateUrl: "partials/login.html"
    })
    .state('mycalender', {
      url: "/mycalender",
      templateUrl: "partials/mycalender.html"
    })
    .state('word', {
      url: "/word",
      templateUrl: "partials/acadminword.html"
    })
    .state('extools', {
      url: "/extools",
      templateUrl: "partials/exTools.html"
    }) ;
});

app.controller("ctrlChange", function($scope, blacStore, blacAccess, $location){
  $scope.saveWord = function(){
    if ($scope.newword == $scope.confirmword && $scope.newword != $scope.oldword)  {
      blacAccess.userChange(blacStore.localUser(), $scope.oldword, $scope.newword).then(
        function(data){
          if (data.rtnCode ==1){ window.alert("更改成功"); $location.path('/mycalender');}
          else window.alert("保存失败"); }
      );
    }
    else window.alert("密码不能一样。");
  }
});

app.controller("ctrlExtools",function($scope,blacAccess,blacUtil){
  var lp = $scope;
  lp.md5String = blacUtil.md5String;

  lp.postReq = function() {
    var l_param = { sql: lp.txtReq, word: blacUtil.md5String(lp.addPass) };
    blacAccess.extoolsPromise(l_param)
      .then(function (aRtn) {
        lp.txtReturn = JSON.stringify(aRtn);
      },
      function (err) {
        lp.txtReturn = JSON.stringify(err);
      }
    );
  }
});

app.controller("ctrlAdminTop",function($location,$scope,blacStore,blacAccess) {
  var lp = $scope;
  lp.loginedUser = blacStore.localUser();
  lp.$on(blacAccess.gEvent.login, function(){
    lp.loginedUser = blacStore.localUser();
  });
  lp.$on(blacAccess.gEvent.broadcast, function(event, aInfo){
    lp.broadInfo = aInfo;
  });
  lp.logout = function(){
    lp.loginedUser = null
    $location.path('/login')
  }

});

app.controller("ctrlLogin",function($rootScope,$scope,$location,blacStore,blacAccess) {
  var lp = $scope;
  lp.rtnInfo = "";
  lp.lUser = {rem:blacStore.localRem(), username:blacStore.localUser(), pw:blacStore.localWord()  };

  lp.userLogin = function () {
    blacAccess.userLoginQ(lp.lUser).then( function(data) {
      if (data.rtnCode > 0) {
        blacStore.localUser(lp.lUser.username);
        blacStore.localWord(lp.lUser.pw);
        blacStore.localRem(lp.lUser.rem);
        $rootScope.$broadcast(blacAccess.gEvent.login);
        $location.path('/mycalender');
      }
      else{
        lp.rtnInfo = data.rtnInfo;
      }
    }, function (error) {  lp.rtnInfo = JSON.stringify(error); });
  };
});

app.controller("ctrlCalender", function($scope,blacUtil,blacStore,blacAccess) {
  var lp = $scope;
  lp.wrapConfirm = blacUtil.wrapConfirm;
  /// ;
  lp.dealEvent = {};

  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,basicWeek,basicDay'
    },
    lang: 'zh-cn',
    defaultDate: blacUtil.strDateTime(null, true),
    editable: true,   // 是否允许拖动。
    eventLimit: true, // allow "more" link when too many events
    selectable: true,  // 允许背景被选择。
    selectHelper: true,
    select: function(start, end) {   // 背景被选择。会自动设置日期。
      lp.dealEvent = { uuid: blacUtil.createUUID() };
      lp.dealEvent.start = blacUtil.strDateTimeM(start._d);
      lp.dealEvent.end = blacUtil.strDateTimeM(end._d);
      lp.dealEvent.allDay = true;
      lp.dealEvent._exState = 'new';
      $scope.$apply( $('#eventModal').modal( { backdrop: "static" } ) );

    },
    eventClick: function(event, element) {
      lp.clickEvent = event;
      event.backgroundColor = "lightblue";
      event.description = 'This is a cool event';
      $('#calendar').fullCalendar('updateEvent', event);  // 更新对象
      console.log(event);
      window.getYou = event;
    },
    eventDrop: function(event, delta, revertFunc) {
      alert(event.title + " was dropped on " + event.start.format());
      if (!confirm("Are you sure about this change?")) {
        revertFunc();
      }
    },
    events: []
  });

  lp.saveEvent = function(){
    /* blacAccess.setAdminColumn( lp.treeData[0]).then(
      function (data) {
        if (data.rtnCode == 1) {
          console.log('save ok. ');
          lp.initColumDefTree();
        }
        else console.log(data);
      },
      function (data) {
        console.log(data);
      });
    */
      $('#eventModal').modal('toggle');
      $('#calendar').fullCalendar('renderEvent', lp.dealEvent, true); // stick? = true
      $('#calendar').fullCalendar('unselect');

  };

  lp.delEvent = function (aNode) {
    if (nodeData.id == 0) return;
    if (window.confirm("确认删除他和所有的子记录么？"))
      if (blacAccess.getDataState(nodeData) == blacAccess.dataState.new)
        aNode.remove();
      else {
        lp.treeData[0].deleteId.push(nodeData.id);
        aNode.remove();
      }
  };

  lp.closeEvent = function(){ $('#eventModal').modal('toggle'); };
});

