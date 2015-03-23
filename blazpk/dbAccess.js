/**
 * Created by Administrator on 2015/3/20.
 */

var bzDb = require('./bzSqlite.js');
//var util = require('./blazpk/bzUtil.js');
//var logInfo = util.info;
//var logErr = util.err;

var acUser = {
  save:function (aUser, aCallback){ bzDb.comSave(aUser, 'USER', aCallback); },
  delete : function(aUUID, aCallback){
    bzDb.runSql("delete from USER where uuid = ?", aUUID, aCallback); } ,
  getByUUID:function(aUUID, aCallback) {
    bzDb.gdb.get("select * from user where uuid = ?" , aUUID, aCallback);
  }
};

var acEvent = {
  save : function (aArticle, aCallback) {  bzDb.comSave(aArticle, 'EVENT', aCallback); },
  getByUUID : function (aID, aCallback) { bzDb.gdb.get("select * from ARTICLE where UUID=?", aID, aCallback); },
  delete : function(aID, aCallback){ bzDb.runSql("delete from ARTICLE where UUID = ?", aID, aCallback); },
  getByDate: function (aDate, aCallback) { bzDb.gdb.get("select * from ARTICLE where UUID=?", aID, aCallback); }
};

exports.acUser = acUser;
exports.acEvent = acEvent;
exports.runSql = bzDb.runSql;
exports.getPromise = bzDb.getPromise;
exports.runSqlPromise = bzDb.runSqlPromise;
exports.genSave = bzDb.genSave;
exports.gdb = bzDb.gdb;
exports.createDB = bzDb.createDB;

/*
  数据库接口， 负责包装底层的数据库相关的东东。
 */

/*
 测试：
 创建数据库：
 dbAccess = require('./blazpk/dbAccess.js');
 dbAccess.acUser.getByUUID('admin', function(err, data){ console.log( err, data ) } );
 dbAccess.runSql("update user set word='4f9268d766cb3dcf4cbc912b39f6e06c' where uuid='admin' ")
 */