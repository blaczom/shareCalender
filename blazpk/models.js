var exSqlite = require('./blazpk/exSqlite.js');

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