const TelegramBot = require("node-telegram-bot-api");
const token = "TOKEN-API";
const bot = new TelegramBot(token, { polling: true });
const translate = require("@iamtraction/google-translate");
const util = require("util");
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri =
  "mongodb+srv://<user>:<password>@mongobbdd.sqlpw.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

/*
 *
 *   *   *   FUNCTIONS    *   *   *
 *
 */

// Wait function
const waitUntil = util.promisify(setTimeout);

// Translator function
function translateText(msg, string) {
  if (msg.from.language_code === "en") bot.sendMessage(msg.chat.id, string);
  else
    translate(string, { from: "en", to: msg.from.language_code })
      .then((res) => {
        bot.sendMessage(msg.chat.id, res.text);
      })
      .catch((err) => {
        console.error(err);
      });
}

//  DATABASE FUNCTIONS

// Function to get the user by id
const getUserById = (id) => {
  var user = "";
  client.connect(async (err) => {
    const collection = client.db("MongoDB").collection("TelegramBot");
    user = await collection.findOne({ telegramId: id });
    client.close();
  });
  return user;
};

// Function to get the user by name
const getUserByUserName = (userName) => {
  var user = "";
  client.connect(async (err) => {
    const collection = client.db("MongoDB").collection("TelegramBot");
    user = await collection.findOne({ user: userName });
    client.close();
  });
  return user;
};

// Function to get all the IDs of all the users
const sendMessageToAll = (message) => {
  client.connect(async (err) => {
    const collection = client.db("MongoDB").collection("TelegramBot");
    await collection.distinct("telegramId").then((res) => {
      res.forEach((id) => {
        bot.sendMessage(id, message);
      });
    });
    client.close();
  });
};

// Function to insert a new user on the table
const insertUser = (msg) => {
  client.connect(async (err) => {
    await client
      .db("MongoDB")
      .collection("TelegramBot")
      .insertOne({
        telegramId: msg.from.id,
        name: msg.from.first_name,
        user: msg.from.username,
      })
      .then(() => translateText(msg, "You were added to the database!"))
      .catch((error) => console.log(error));
    client.close();
  });
};

// Function to get the user by id
const checkAndAdd = async (msg) => {
  client.connect(async (err) => {
    const collection = client.db("MongoDB").collection("TelegramBot");
    await collection
      .findOne({ telegramId: msg.from.id })
      .then((res) => {
        if (res === null) insertUser(msg);
        else {
          translateText(msg, "You are already registered.");
          client.close();
        }
      })
      .catch((error) => console.log(error));
  });
};

/*
 *
 *   *   *   COMMAND LIST    *   *   *
 *
 */

// Welcome command
bot.onText(/^\/start/, (msg) => {
  translateText(
    msg,
    `Hello ${msg.from.first_name}. I'm your favorite bot.❤`,
    msg.from.language_code
  );
  checkAndAdd(msg);
});

// Listener
bot.on("message", (msg) => {});

// Command to send a message to all the subscriptors
bot.onText(/^\/send(.+)/, (msg, match) => {
  sendMessageToAll(match[1]);
});

// Command for tests
bot.onText(/^\/test/, (msg) => {});
