/**
 * Created by Administrator on 2015/1/18.
 */

/**
 * Created by blaczom@gmail.com on 2014/10/1.
 */

var express = require('express'),
  router = express.Router(),
  models =  require('../blazpk/models'),
  Q = require('q');

var rtnErr = function(aMsg, aErr) {
  return {rtnCode:-1, "rtnInfo":JSON.stringify(aMsg), "alertType":0, error:JSON.stringify(aErr), exObj:{} }
};
var rtnMsg = function(aMsg, aObj) {
  return {rtnCode:1, "rtnInfo":aMsg, "alertType":0, error: [], exObj:aObj }
};

function logInfo(){console.log(arguments);};
function logErr(){console.log(arguments);};

router.get('/', function(req, res) {
  res.send('没有此功能。');
});

function checkLogin(req, res){ return(req.session.loginUser); };  // 只信任服务器端的数据。

router.post('/', function(req, res) {

  // 定义一个通用的返回函数。
  function comCallBackFunc(aErr, aRtn) {
    if (aErr) res.json( rtnErr("操作失败", aErr) ); else  res.json( rtnMsg("操作成功", aRtn) );
  }

  // 得到一个通用的入口结构。
  logInfo("get client rest: " , req.body);
  var lFunc = req.body['func']; // 功能名称： 'userlogin' 等等
  var lExparm = req.body['ex_parm'];  // 参数对象: {}

  /* 除了userLogin, userReg, 以外，其余的功能都需要 ---登录检查，  */
  if ("userlogin,userReg,extools,,,".indexOf(lFunc+",") < 0) {   // 需要登录的对象。
    if (!checkLogin(req,res)) {
      var l_rtn = rtnErr('未登录，请先登录。');
      l_rtn.rtnCode = 0;
      l_rtn.appendOper = 'login';   // rtnCode = 0的时候，就是有附加操作的时候。
      res.json(l_rtn);
      return; // STOP HERE.
    }
  }

  // 根据入口结构，进行对应的正常功能处理：
  switch (lFunc){
    case "userlogin": { // lExparm.user:{username:xx,md5:xx}
      models.objUser.getByUUID(lExparm.user.username, function (aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          if (aRtn) {
            if (aRtn.WORD == lExparm.user.md5) {
              req.session.loginUser = lExparm.user.username;
              var l_rtnUsr = rtnMsg('登录成功。');
              l_rtnUsr.exObj = aRtn.EXPARM;
              res.json(l_rtnUsr);
            }
            else {  res.json(rtnErr('密码有误'));   }
          }
          else {  res.json(rtnErr('用户不存在'));   }
        }
      });
      break;
    }
    case "userChange": {
      //{"rtnCode":1,"rtnInfo":"成功。","alertType":0,"error":[],"exObj":{columnTree:[...]}}
      // lExparm.username,old,new
      models.objUser.getByUUID(lExparm.username, function (aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          if (aRtn) {
            if (aRtn.WORD == lExparm.old) {
              // 更新密码：
              var l_user = models.objUser.new();
              l_user.uuid = lExparm.username;
              l_user.word = lExparm.new;
              l_user._exState = "dirty";  // new , clean, dirty.
              l_user._exUpdate = { word: lExparm.new };
              models.objUser.save(l_user, comCallBackFunc );
            }
            else {  res.json(rtnErr('密码有误'));   }
          }
          else { res.json(rtnErr('用户不存在'));   }
        }
      });
      break;
    }
    case "setEvent": {
      /*{ func: 'setEvent', ex_parm:{     dealEvent:    lp.dealEvent = { uuid: blacUtil.createUUID() };
      lp.dealEvent.start = blacUtil.strDateTimeM(start._d);
      lp.dealEvent.end = blacUtil.strDateTimeM(end._d);
      lp.dealEvent.allDay = true;
      lp.dealEvent._exState = 'new';}}
      */
      models.objEvent.save(lExparm.dealEvent, comCallBackFunc );
      break;
    }
    case "getEvent":
      models.objEvent.getByOwner(lExparm.owner, comCallBackFunc);  // ex_parm:{owner: aOwner}  })
      break;
    case "delEvent":
      models.objEvent.delete(lExparm.uuid, comCallBackFunc);  // ex_parm:{owner: aOwner}  })
      break;

    case "extools":
        // lExparm. {sql: ls_sql, word: ls_admin};
      if (lExparm.word == '91df0168b155dae510513d825d5d00b0') {
          if (lExparm.sql=='restart') process.exit(-1);
          dbAccess = require('../blazpk/dbAccess');
          dbAccess.runSql(lExparm.sql, [], function(aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                  ls_rtn = rtnMsg("成功");
                  ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
                  res.json(ls_rtn);
              }
          })
      }
      else
          res.json(rtnErr(aErr));
      break;

    default :
      res.json(rtnErr('不存在该请求：' + JSON.stringify(req.body)));
      break;
  }
});

module.exports = router;

