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
    lp.loginedUser = null;
    $location.path('/login')
  }

});

app.controller("ctrlLogin",function($rootScope,$scope,$location,blacStore,blacAccess) {
  var lp = $scope;
  lp.rtnInfo = "";
  lp.lUser = {rem:blacStore.localRem(), username:blacStore.localUser(), pw:blacStore.localWord()  };
  //$scope.$apply( lp.lUser );  // 显示窗口：绑定在dealevent上。
  lp.userLogin = function () {
    blacAccess.userLoginQ(lp.lUser).then( function(data) {
      if (data.rtnCode > 0) {
        blacStore.localUser(lp.lUser.username);
        blacStore.localWord(lp.lUser.pw);
        blacStore.localRem(lp.lUser.rem);
        var l_userParm = JSON.parse( data.exObj );
        if (l_userParm.hasOwnProperty('bgColor')) blacStore.customSet('eventColor', l_userParm.bgColor);

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

  function wrapEvent(aStr) { return $.fullCalendar.moment(aStr); }
  var lp = $scope;
  lp.wrapConfirm = blacUtil.wrapConfirm;
  /// 前台所有的属性，以小写为主。 后台数据库和从数据库返还的名字，大写。
  lp.dealEvent = {};  // 前台显示的event内容。
  lp.origEvent = null;  // 当前正在处理的event
  lp.userParm = {};    // 所有用户的参数。（颜色用）

  lp.initData = function() {
    blacAccess.getEvent( blacStore.localUser() ).then(     /// 得到当前用户权限的event。
      function(data){
        if (!blacAccess.checkRtn(data)) return ;  // 登录监察。
        if (data.rtnCode == 1) {
          // data 是一个event的数据哈  $("#calendar").fullCalendar("removeEvents",event.id);
          var showEvent = [];           // 检索所有的event对象用来显示。
          for (var i in data.exObj){
            var l_borderColor = (data.exObj[i].FINISHED)? "#ff0000": "black";
            showEvent.push({
              uuid: data.exObj[i].UUID ,
              id: data.exObj[i].UUID,
              allDay : blacUtil.verifyBool(data.exObj[i].ALLDAY),
              start: wrapEvent(data.exObj[i].START),
              end: wrapEvent(data.exObj[i].END),
              finished: blacUtil.verifyBool(data.exObj[i].FINISHED),
              owner: data.exObj[i].OWNER,
              backgroundColor : lp.userParm[data.exObj[i].OWNER]['bgColor'],
              public: blacUtil.verifyBool(data.exObj[i].PUBLIC),
              title: data.exObj[i].TITLE,
              description: data.exObj[i].DESCRIPTION,
              borderColor: l_borderColor
            })
          };
          console.log('get event ok. ', showEvent);
          $('#calendar').fullCalendar({
            header: {
              left: 'prev,next today',
              center: 'title',
              right: 'month,basicWeek,basicDay'
            },
            lang: 'zh-cn',
            ignoreTimezone: true,
            defaultDate: blacUtil.strDateTime(null, true),
            editable: true,   // 是否允许拖动。
            eventLimit: true, // allow "more" link when too many events
            selectable: true,  // 允许背景被选择。
            selectHelper: true,
            events: showEvent,
            select: function(start, end) {   // 背景被选择。会自动设置日期。
              console.log('select');window.getYou = start;
              lp.dealEvent = { uuid: blacUtil.createUUID() };  // 新建的一个事件的内容。
              lp.dealEvent.id = lp.dealEvent.uuid;
              lp.dealEvent.start = blacUtil.strDateTimeM(start._d);  // 转换成字符串显示。保存时转回去。
              //lp.dealEvent.end = blacUtil.strDateTimeM( new Date(end._d - 0 - 86400000 ));
              lp.dealEvent.end = blacUtil.strDateTimeM(end._d);
              lp.dealEvent.owner = blacStore.localUser();
              lp.dealEvent.allDay = true;
              lp.dealEvent._exState = 'new';
              lp.dealEvent.finished = false;
              lp.dealEvent.public = true;
              var l_eventColor = blacStore.customGet('eventColor');
              if (blacUtil.isString(l_eventColor)) lp.dealEvent.color = l_eventColor;
              $scope.$apply( $('#eventModal').modal( { backdrop: "static" } ) );  // 显示窗口：绑定在dealevent上。

            },
            eventClick: function(event, element) {
              console.log('eventClick');window.getYou = event;
              // event.backgroundColor = "lightblue";
              lp.origEvent = event; // 记录当前点击的event。 以后用来更新。
              lp.dealEvent = {};
              for (var i in event) if (blacAccess.eventColumn.indexOf(i)>-1) lp.dealEvent[i] = event[i];
              lp.dealEvent.start = blacUtil.strDateTimeM(event.start._d);  // 转换成字符串显示。保存时转回去。
              if (event.hasOwnProperty('end'))
                if (event.end) lp.dealEvent.end = blacUtil.strDateTimeM(event.end._d);
              lp.dealEvent._exState = 'dirty';
              $scope.$apply( $('#eventModal').modal( { backdrop: "static" } ) );
            },
            eventDrop: function(event, delta, revertFunc) {
              if (confirm("确定拖到：" + event.start.format() + "?" )) {
                var l_event = {};
                for (var i in event) if (blacAccess.eventColumn.indexOf(i)>-1) l_event[i] = event[i];
                l_event.start = blacUtil.strDateTimeM(event.start._d);
                l_event.end = blacUtil.strDateTimeM(event.end._d);
                l_event._exState = 'dirty';
                blacAccess.setEvent( l_event  ).then(
                  function (data) {
                    if (data.rtnCode == 1) {
                      console.log('move saved ok. ');
                    }
                    else { alert('保存失败。请通知管理员' + data.rtnInfo); revertFunc();; }
                  },
                  function (err) {
                    alert('保存失败。请通知管理员' + err); revertFunc(); ;
                  });
              }
              else{
                revertFunc();
              }
            }
          });
        }
        else { alert('保存失败。请通知管理员'); console.log(data); }
      },
      function (data) {
        alert('保存失败。请通知管理员'); console.log(data) ;
      });
  };

  lp.saveEvent = function(){
    var l_event = {};
    console.log('prepare saveEvent ', lp.dealEvent);
    lp.dealEvent.start = $('#datetimepicker1').val();
    lp.dealEvent.end = $('#datetimepicker2').val();
    if (lp.dealEvent.end <= lp.dealEvent.start) {
      alert('结束日期应该大于起始日期，全天计划应该截止到第二天。');
      return;
    }

    for (var i in lp.dealEvent) if (blacAccess.eventColumn.indexOf(i)>-1) l_event[i] = lp.dealEvent[i];
    // 有点击的event。click的时候，是object
    blacAccess.setEvent( l_event  ).then(
      function (data) {
        if (data.rtnCode == 1) {
          console.log('save ok. ');
          $('#eventModal').modal('toggle');
          lp.dealEvent.start = wrapEvent(lp.dealEvent.start);
          lp.dealEvent.end = wrapEvent(lp.dealEvent.end);

          if (lp.dealEvent._exState == 'new') {
            $('#calendar').fullCalendar('renderEvent', lp.dealEvent, true);  // 直接render内容就可以。
          }
          else if (lp.dealEvent._exState == 'dirty') {  // clicked的event
            for (var i in lp.dealEvent) if (blacAccess.eventColumn.indexOf(i)>-1) lp.origEvent[i] = lp.dealEvent[i];
            //lp.origEvent.start =  new Date( new Date( lp.dealEvent.start ) - 0 - 28800000 );
            //lp.origEvent.end = new Date( new Date( lp.dealEvent.end ) - 0 - 28800000 );
            // 不知道为啥，callerder就是自动给我加8timezone。
            console.log('save over ..... to update Event. end is ', lp.origEvent.end);
            //$('#calendar').fullCalendar('updateEvent', lp.origEvent);  // update总是给我加8timezone。服了。
            $("#calendar").fullCalendar("removeEvents",lp.origEvent.id);
            $("#calendar").fullCalendar("addEventSource",[lp.dealEvent]);

          }
          $('#calendar').fullCalendar('unselect');
          lp.dealEvent._exState = 'clean';
        }
        else { alert('保存失败。请通知管理员' + data.rtnInfo); console.log(data); }
      },
      function (err) {
        alert('保存失败。请通知管理员' + err); console.log(err) ;
      });

  };

  lp.delEvent = function () {
      if (lp.dealEvent._exState == "new")
        $('#eventModal').modal('toggle');
      else
        if (window.confirm("确认删除记录么？")) {
          blacAccess.delEvent(lp.dealEvent.uuid).then(
            function(data){
              if (data.rtnCode == 1) {
                console.log('delete ok. ');
                $('#eventModal').modal('toggle');
                $("#calendar").fullCalendar("removeEvents",lp.dealEvent.id);
                $('#calendar').fullCalendar('unselect');
                lp.dealEvent = {};
              }
              else { alert('删除失败。' + data.rtnInfo); console.log(data); }
            },
            function(err){
              alert('删除失败。请通知管理员' + err); console.log(err) ;
            }
          );
        }
  };

  lp.closeEvent = function(){ $('#eventModal').modal('toggle'); lp.dealEvent = {}; };


  blacAccess.getUserParm().then(
    function(data){
      if (data.rtnCode == 1) {
        console.log('got info. ');
        for (var i in data.exObj){
          lp.userParm[data.exObj[i]['UUID']] = JSON.parse( data.exObj[i]['EXPARM'] );
          // [{UUID:xxx, EXPARM: {bgColor:"xxx"} }]   -> { UUID : {bgColor:xxx} }   exObj['uuid']['bgColor']
        }
        console.log(lp.userParm);
        window.getYou = lp.userParm;
        lp.initData();
      }
      else { alert('操作失败。请通知管理员'); console.log(data); }
    },
    function(err){
      alert('操作失败。请通知管理员'); console.log(err) ;
    }
  );

});

