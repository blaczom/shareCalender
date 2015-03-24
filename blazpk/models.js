/*
 * Created by blacz4gmail on 2014/11/17.
 *
 * models是上层应用的接口。和底层dbAccess接口。    rest - models - dbAccess - dbSqlite.
 * models负责数据的业务逻辑和模型定义。 更改以后，需要下层的接口全部更改：一般是不同的sql语句和业务逻辑。
 * 数据库对象的默认约定必须在dbSqlite中实现： 所有对象的数据库字段不能是下划线开头。
 * 有特殊含义的字段：
 * _exState ： 必须在对象中存在。new ， dirty， clean 。 是对象状态标志，下层根据他判断生成的sql语句。
 * _exUpdate : 可选，如果有这个字段，在更新的时候，只更新这些字段。如果是new，会忽略掉。
 *
 * 数据库范围的字段都是大写的，需要大小写不区分判断。模型的一般是小写混合的。
 */

var gdbAccess = require('./dbAccess.js');

var objUser = function() {
  this.uuid = '';
  this.word = '';
  this.exparm = {};       // 可以自己增加的内容。
  this._exState = "new";  // new , clean, dirty.
};

objUser.prototype.new = function(){  return( new objUser() ); };
objUser.prototype.save = gdbAccess.acUser.save;
objUser.prototype.delete = gdbAccess.acUser.delete;
objUser.prototype.getByUUID = gdbAccess.acUser.getByUUID;

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
objEvent.prototype.getByUUID = gdbAccess.acEvent.getByUUID;
objEvent.prototype.getByDate = gdbAccess.acEvent.getByDate;
objEvent.prototype.getByOwner = gdbAccess.acEvent.getByOwner;


exports.objUser = objUser.prototype.new();
exports.objEvent = objEvent.prototype.new();
