var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
console.log("Vannibot online!");
// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    try {
        if (message.substring(0, 1) == '!') {
            var args = message.substring(1).split(' ');
            var cmd = args[0];

            args = args.splice(1);
            switch (cmd) {
                // !ping
                case 'ping':
                    doMessage("Pong!", channelID);
                    break;
                case 'me':
                    doMessage(user, channelID);
                    break;
                case 'testjson':
                    doMessage(tryJSON('Vanni', 'Letti', 4, 5), channelID);
                    break;
                case 'addchar':
                    addChar(args, user, userID, channelID);
                    break;
                case 'initusers':
                    initUsers(channelID);
                    break;
                case 'active':
                    setActiveChar(args, user, userID, channelID);
                    break;
                case 'roll':
                    roll(args, user, userID, channelID);
                    break;
                case 'characters':
                    printCharacters(user, userID, channelID);
                    break;
                case 'deletechar':
                    deleteCharacter(args, user, userID, channelID);
                    break;
                case 'commands':
                    printCommands(channelID);
                    break;
                case 'initparties':
                    initParties(channelID);
                    break;
                case 'makeparty':
                    makeParty(args, channelID);
                    break;
                case 'joinparty':
                    joinParty(args, user, userID, channelID);
                    break;
                case 'rollparty':
                    rollParty(args, channelID);
                    break;
                case 'deleteparty':
                    deleteParty(args, channelID);
                    break;
            }
        }
    }
    catch(err){
        doMessage("Oh no! Something went wrong. Make sure to check if your message is correct!\n If it is, I'm sorry :c. Please go smack Vanni and tell him to fix it.", channelID);
        console.log(err);
    }
});

function initParties(channelID){
    //TODO implement
}

function makeParty(channelID){
    //TODO implement
}

function joinParty(channelID){
    //TODO implement
}

function rollParty(channelID){
    //TODO implement
}

function deleteParty(channelID){
    //TODO implement
}

function printCommands(channelID){
    var message = "Currently available commands: !ping, !me, !addchar, !initusers, !active, !roll, !characters, !deletechar, !commands";
}


//TODO numd20s, error handling more elegant, cleanup
function roll(args, user, userID, channelID){
    if(args.length == 0){
        doMessage("Syntax: !roll <attribute>/d20",channelID);
        return;
    }
    var content = fs.readFileSync("users.json");
    var users = JSON.parse(content);
    var message = "Oops. I haven't managed to roll anything - sorry!"
    var charname;
    if(args.length < 2) {
        console.log("Using active character for roll");
        charname = users[userID].activeChar
    }
    else {
        console.log("Using provided character for roll");
        charname = users[userID].characters[args[1]];
    }
    var char = users[userID].characters[charname];
    var modifier = 0; //TODO cleanup
    var roll = args[0]; //TODO cleanup
    if(isNaN(parseInt(roll.charAt(0)))){
        var stats = ['str', 'dex', 'con', 'int', 'cha', 'wis']
        var dice = rolldie(20);
        if(!stats.includes(roll)){
            doMessage("I'm sorry, " + user + " , but I'm afraid I can't roll that.")
        }
        else{
            modifier = char[roll];
            result = parseInt(dice) + parseInt(modifier);
            message = charname + " rolled **" + result + "** (" + dice + "+" + modifier + ").";
        }
    }
    else{
        // message = charname + " rolled *" + dice + "*."
        var split1 = roll.split('d');
        var numdice = parseInt(split1[0]);
        var split2 = split1[1].split('+');
        var diceSize = split2[0];
        if(split2.length > 1){
            modifier = parseInt(split2[1]);
        }
        var diceString = "";
        var thisRoll;
        result = 0;
        for(var i = 0; i < numdice; i++){
            thisRoll = rolldie(diceSize);
            diceString += thisRoll + "+";
            result = result + thisRoll;
        }
        if(modifier != 0){
            diceString += modifier;
            result = result + modifier;
        }
        else{
            diceString = diceString.substring(0, diceString.length - 1);
        }
        message = charname + " rolled **" + result + "** (" + diceString + ")."
    }
    doMessage(message, channelID);
}

function rolldie(dieSize){
    return Math.ceil(Math.random() * dieSize);
}

//TODO check if file already exists
function initUsers(channelID){
    //if (fs.existsSync(path)) {
    //    // Do something
    //}
    var users = {};
    fs.writeFile("users.json", JSON.stringify(users, null, '\t'), function(err) {
        if (err) {
            console.log(err);
        }
    });
    doMessage("User database reinitialised", channelID);
}

function printCharacters(user, userID, channelID){
    var content = fs.readFileSync("users.json");
    var users = JSON.parse(content);
    var message = "Characters for " + user + ":\n"
    for(var char in users[userID].characters){
        message += char + "\n";
    }
    doMessage(message, channelID);
}

//TODO add verification
function deleteCharacter(args, user, userID, channelID){
    if(args.length == 0){
        doMessage("Usage: !deletechar <character name>", channelID);
        return;
    }
    var name = args[0];
    var content = fs.readFileSync("users.json");
    var users = JSON.parse(content);
    if(!users[userID].characters.hasOwnProperty(name)){
        message = "Cannot find character " + name + " for user " + user + ".";
    }
    else {
        delete users[userID].characters[name];
        message = "Deleted character " + name + " for " + user + ".";
        fs.writeFile("users.json", JSON.stringify(users, null, '\t'), function(err) {
            if (err) {
                console.log(err);
            }
        })
    }
    doMessage(message, channelID);
}

function setActiveChar(args, user, userID, channelID){
    var content = fs.readFileSync("users.json");
    var users = JSON.parse(content);
    if(!users.hasOwnProperty(userID)){
        var message = "Hi, " + user + "! Please create a character first, and I will set it as your active character automatically."
        return;
    }
    if(args.length == 0){
        console.log('Ding!');
        var message = user + ", your active character is currently " + users[userID].activeChar;
        doMessage(message, channelID);
        return
    }
    charName = args[0];
    if(!users[userID].characters.hasOwnProperty(charName)){
        var message = user + ", you do not have a character called " + charName + " yet.";
        doMessage(message, channelID);
        return;
    }

    users[userID].activeChar = charName;
    fs.writeFile("users.json", JSON.stringify(users, null, '\t'), function(err) {
        if (err) {
            console.log(err);
        }
    })
    var message = charName + " set as active character for " + user;
    doMessage(message, channelID);
}

//TODO delete character
function addChar(args, user, userID, channelID){
    if(args.length == 0){
        var message = "Syntax: !addchar name str dex con int cha wis"
        doMessage(message, channelID);
        return;
    }
    var content = fs.readFileSync("users.json");
    var users = JSON.parse(content);
    var newChar = {
        str: args[1],
        dex: args[2],
        con: args[3],
        int: args[4],
        cha: args[5],
        wil: args[6]
    };
    if(!users.hasOwnProperty(userID)){
        users[userID] = {};
        users[userID].name = user;
        users[userID].characters = {};
        users[userID].activeChar = args[0];
    }
    users[userID].characters[args[0]] = newChar;
    fs.writeFile("users.json", JSON.stringify(users, null, '\t'), function(err) {
        if (err) {
            console.log(err);
        }
    })
    var message = "Character " + args[0] + " created for " + user;
    doMessage(message, channelID);
}

//TODO delete and remove from switch list
function tryJSON(username, charactername, value, value2){
    console.log('Start')
    var content = fs.readFileSync("test.json");
    var jsonContent = JSON.parse(content);
    console.log("Read from file:");
    console.log(jsonContent["Vanni"]["Letti"].int);
    console.log('Incrementing. Letti is getting smarter c:');
    jsonContent["Vanni"]["Letti"].int = jsonContent["Vanni"]["Letti"].int + 1;
    console.log('Saving');
    /* myObj = {};
    myObj[username] = {};
    myObj[username][charactername] = {};
    myObj[username][charactername].int = value;
    myObj[username][charactername].dex = value2;
    */
    fs.writeFile("test.json", JSON.stringify(jsonContent, null, '\t'), function(err) {
        if (err) {
            console.log(err);
        }
    });
    console.log('End');
}

function doMessage(message, channelID){
    bot.sendMessage({
        to: channelID,
        message: message
    })
}