// Usage: mongo <level-session-db-host> -u <user> -p <pwd> averageFirstWeekPlaytime.js

var sTime = (new Date()).getTime();

var auth = JSON.parse(cat('.mainAuth.json'));
var main = connect(auth.main.uri, auth.main.user, auth.main.password);

// Find all users who were created between 2 weeks ago and last week

const START_DAYS_AGO = 14;
const END_DAYS_AGO = 7;
const WINDOW_DAYS = 7;

function objectIdFromDate(date) {
  return ObjectId(Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000");
}

print("Getting all users created between", START_DAYS_AGO, "and", END_DAYS_AGO, "days ago...");

var twoWeeksAgo = new Date();
twoWeeksAgo.setDate(twoWeeksAgo.getDate() - START_DAYS_AGO);
twoWeeksAgo.setHours(0, 0, 0, 0);

var oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - END_DAYS_AGO);
oneWeekAgo.setHours(0, 0, 0, 0);

var fromId = objectIdFromDate(twoWeeksAgo);
var toId = objectIdFromDate(oneWeekAgo);

var users = main.users.find({ _id: { $gte: fromId, $lt: toId }});

print("Got the users...");
// Create an array of query objects to plug into $or, below.
var userSessionQueries = users.map((u) => {
  var oneWeekAfterCreation = u._id.getTimestamp()
  oneWeekAfterCreation.setDate(oneWeekAfterCreation.getDate() + WINDOW_DAYS)
  return {
    _id: { $lt: objectIdFromDate(oneWeekAfterCreation) },
    creator: u._id.str
  }
});


// Find all their sessions within a week of their creation date
var sessions = db.level.sessions.aggregate([
  {
    $match: { $or: userSessionQueries }
  },
  {
    $group: {
      _id: "$creator",
      playtimeSum: {
        $sum: "$playtime"
      }
    }
  }
]);

print("Got the sessions...");

var sum = 0;
var i = 0;

while(sessions.hasNext()) {
  var aggData = sessions.next();
  sum += aggData.playtimeSum
  i++;
}

print("Average playtime for", i, "users:");
var avg = sum / i;
print(avg, "seconds");
print(avg/60, "minutes")

print("total script time", (new Date()).getTime() - sTime, "microseconds");
