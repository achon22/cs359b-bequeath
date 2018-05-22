var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("bequeathDB");
  dbo.createCollection("beneficiaries", function(err, res) {
    if (err) throw err;
    console.log("beneficiaries collection created!");
    db.close();
  });
});
