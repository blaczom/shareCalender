/*
 * Created by blacz4gmail on 2014/11/17.
 */

var gdbAccess = require('./blazpk/exSqliteAccess.js');
var util = require('./blazpk/util.js');
var Q = require('q');

var logInfo = util.info;
var logErr = util.err;
var funcErr = function(err) { logErr(err) };

var objUser = function() {
  this.uuid = '';
  this.uuname = '';
  this.word = '';
  this.exparm = {};       // 可以自己增加的内容。
  this._exState = "new";  // new , clean, dirty.
};

objUser.prototype.new = function(){  return( new objUser() ); };
objUser.prototype.save = gdbAccess.acUser.save;
objUser.prototype.delete = gdbAccess.acUser.delete;
objUser.prototype.getByName = gdbAccess.acUser.getByUUID;

var objEvent = function() {
  this.uuid = '';
  this.id = '';
  this.title = '';
  this.allDay = '';
  this.start = '';  //  "2014-05-01T12:00:00"  var local = $.fullCalendar.moment('2014-05-01T12:00:00');
  this.end = '';
  this.editable = '';
  this.finished = '';
  this.public = '';
  this.owner = '';
  this._exState = 'new';
};
objEvent.prototype.new = function(){  return(new objEvent()); };
objEvent.prototype.save = gdbAccess.acEvent.save;
objEvent.prototype.delete = gdbAccess.acEvent.delete;
objEvent.prototype.getByID = gdbAccess.acEvent.getByUUID;












var helpUser = {
  save:function (aUser, aCallback){ exSqlite.comSave(aUser, 'USER', aCallback); },
  delete : function(aNickName, aCallback){
    exSqlite.runSql("delete from USER where NAME = ?", aNickName, aCallback); } ,
  getByName:function(aNickName, aCallback) {
    exSqlite.gdb.get("select * from user where NAME= ?" , aNickName, aCallback);
  }
};

var helpArticle = {
  save : function (aArticle, aCallback) {  exSqlite.comSave(aArticle, 'ARTICLE', aCallback); },
  getByID : function (aID, aCallback) { exSqlite.gdb.get("select * from ARTICLE where ID=?", aID, aCallback); },
  delete : function(aID, aCallback){ exSqlite.runSql("delete from ARTICLE where ID = ?", aID, aCallback); }
};



exports.USER = new objUser();
exports.COLUMN = new objColumn();
exports.ARTICLE = new objArticle();
exports.setDirty = function(aParm) { aParm._exState = 'dirty' };
exports.setNew = function(aParm) { aParm._exState = 'new' };
exports.setClean = function(aParm) { aParm._exState = 'clean' };
exports.runSql = gdbLib.runSql;
exports.runSqlPromise = gdbLib.runSqlPromise;
exports.getPromise = gdbLib.getPromise;
exports.dbLib = gdbLib;