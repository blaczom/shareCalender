/**
 * Created by blaczom@gmail on 2014/9/20.
 *
 *
 * 所有的对象都应该按照统一的格式进行。 _exState  $hash 下划线和$开头的字段，作为控制字段存在。
 * _exState : new  dirty  else.   主键必须是 uuid
 *
 */

var sqlite3 = require('sqlite3');
var fs = require('fs');
var Q = require('q');

var util = require('./bzUtil.js');
var logInfo = util.info;
var logErr = util.err;

var gdbFile = 'blaz.db'; // if exist blaz.db, means the sql ddl have been execute.

var createDB = function(adbFile){
  if (!adbFile) adbFile = gdbFile;
  logInfo("---no databse file. will create it:---", gdbFile);
  var ldb = new sqlite3.Database(adbFile);
  var l_run = require('./createSqlite.json').sqlCreate;
  ldb.serialize( function() {
    for (var i in l_run) {
      ldb.run(l_run[i], function (err, row) {
        if (err) logErr(" 初始化创建数据库错误: ",err.message,l_run[i]);
      });
    }
  });
  ldb.close();
};

if (!fs.existsSync(gdbFile)) createDB();

var gdb = new sqlite3.Database(gdbFile);

gdb.on('trace', function() { logInfo(  arguments ) } );

var genSave = function (aObj, aTable) {
//  _exState用来指示处理。  根据json对象 和 对应的表名（安全起见不能保存在json中），返回sql和执行参数。

  if (!aObj.hasOwnProperty('_exState')) {
    logInfo("dbsqlite3 genSave get a wrong db object." + aObj);
    return ["", null];
  }
  var l_genCol = aObj;
  if (aObj._exState == 'dirty' &&  aObj.hasOwnProperty('_exUpdate')) l_genCol = aObj._exUpdate ;  // 如果指定了更新列，就只更新这个列。

  var l_cols = [], l_vals = [], l_quest4vals=[],  l_pristine = [];
  // 列名， 列值(带引号)， 参数？， 原始值
  for (var i in l_genCol) {    // 列名， i， 值 aObj[i]. 全部转化为string。
    var l_first = i[0];
    if (l_first != '_' && l_first!='$' ) { // 第一个字母
      var lsTmp = (aObj[i]==null) ? "" : aObj[i];   // 内容如果为空，就转化成字符串空。
      switch (typeof(lsTmp)) {
        case "string": case "boolean":case "object":
          l_cols.push(i);
          l_vals.push("'" + lsTmp + "'");
          l_quest4vals.push("?");
          l_pristine.push(lsTmp);
          break;
        case "number":
          l_cols.push(i);
          l_vals.push(lsTmp);
          l_quest4vals.push('?');
          l_pristine.push(lsTmp);
          break;
        case "function":    // 不处理。
          break;
        default:
          logInfo("-- genSave don't now what it is-" + i + ":" + aObj[i] + ":" + typeof(lsTmp));
          process.exit(-100);
          break;
      }
    }
  }

  var l_sql="";
  switch (aObj._exState) {
    case "new": // "INSERT INTO foo() VALUES (?)", [1,2,3]
      ls_sql = "insert into " + aTable + '(' + l_cols.join(',') + ") values ( " + l_quest4vals.join(',') + ')';
      break;
    case "dirty": // update table set col1=val, col2="", where uuid = "";
      var lt = [];
      for (i = 0 ; i < l_cols.length; i ++) lt.push(l_cols[i] + "=" + l_quest4vals[i] );
      ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where uuid = '" + aObj['uuid'] +"'";
      break;
    default : // do nothing.
      ls_sql = "";
      logErr('i dont know why you call me with this clean data---exState' , aObj);
  }
  return [ls_sql, l_pristine];   // 返回一个数组。前面是语句，后面是参数。f
};

var runSql = function (aSql, aParam,  aCallback){
  logInfo("db runSql with param ", aSql, aParam);
  if (aSql.trim().length > 4)  {  // 防止执行空的sql语句。
    if (aParam) {if (toString.apply(aParam) !== "[object Array]") aParam = [aParam];} else aParam = [];
    // 如果传过来的参数是数组，就直接赋值为数组，否则作为空
    gdb.all(aSql, aParam, function (err, row){
      if (err) logErr("runSql",err,aSql,aParam);
      if (aCallback) aCallback(err, row);
    } );
  }
  else // 空的sql语句。
    if (aCallback) aCallback("no sql", aParam);
};

var runSqlPromise = function (aSql, aParam) {
  logInfo("db runSqlPromise with param ", aSql, aParam);
  if (aParam) {if (toString.apply(aParam) !== "[object Array]") aParam = [aParam];} else aParam = [];
  var deferred = Q.defer();
  if (aSql.trim().length > 4)  {
    gdb.all(aSql, aParam, function (err, row) {
      if (err) {if (err) logErr("runSqlPromise",err,aSql,aParam);deferred.reject(err);} else deferred.resolve(row);
    });
  }
  else deferred.reject("no sql statement ");
  return deferred.promise;
};

var getPromise = function (aSql, aParam) {
  logInfo("db getPromise with param ", aSql, aParam);
  if (aParam) {if (toString.apply(aParam) !== "[object Array]") aParam = [aParam];} else aParam = [];
  var deferred = Q.defer();
  if (aSql.trim().length > 4)  {
    gdb.get(aSql, aParam, function (err, row) {
      if (err) {if (err) logErr("getPromise",err,aSql,aParam);deferred.reject(err);} else deferred.resolve(row);
    });
  }
  else deferred.reject("no sql statement ");
  return deferred.promise;
};

var comSave = function(aTarget, aTable, aCallback) {
  try {
    l_gen = genSave(aTarget, aTable);  // 返回一个数组，sql和后续参数。
    logInfo("genSave ok, com save will runsql with param: ", aTarget, aTable, l_gen);
    gdb.run(l_gen[0], l_gen[1], function (err, row) {
      row = this.changes;  // 影响的行。
      if (err) logErr(err);
      aCallback(err, row);
    });
  }
  catch (err) {
    logErr('comSave catch a error here ', err);
    if (aCallback) aCallback(err, err);
  }
};


exports.runSql = runSql;
exports.getPromise = getPromise;
exports.runSqlPromise = runSqlPromise;
exports.genSave = genSave;
exports.gdb = gdb;
exports.createDB = createDB;
exports.comSave = comSave;

/*
  所有数据对象必须有uuid作为主键。
*/


/*
test:
 sqlite = require('./blazpk/bzSqlite.js');
 sqlite.getPromise('select * from user').then(function(data){console.log(data)});
 */