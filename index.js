const express = require('express')
const expressApp = express()
const axios = require("axios");
const path = require("path")
const port = process.env.PORT || 3000;

const fs = require('fs');

expressApp.use(express.static('static'))
expressApp.use(express.json());
require('dotenv').config();

const { Telegraf } = require('telegraf');

expressApp.get("/", (req, res) => {
    res.send(200)
});


const bot = new Telegraf(process.env.BOT_TOKEN);

console.log("Starting bot")
bot.launch()
console.log("Bot started")


bot.command('start', ctx => {

    fslog(({
        command: 'start',
        chat: ctx.chat,
        from: ctx.from,
    }))

    bot.telegram.sendMessage(ctx.chat.id, `Hello there ${ctx.from.first_name}! Welcome to halving reminder 😎. Este bot es exclusivo de cypherplatxs, parcerxs. Type /reminder to get the date.`, {
        message_thread_id: getThread(ctx.chat.is_forum)
    })
})


bot.command('reminder', ctx => {

    fslog(({
        command: 'start',
        chat: ctx.chat,
        from: ctx.from,
    }))

    axios.get('https://blockchain.info/q/getblockcount')
        .then(response => {
            let halvingDate = getHalvingDate(response.data)

            bot.telegram.sendMessage(ctx.chat.id,
                `
📆 Next halving is happening on 
    🏄‍♀️ ${halvingDate.halvingDate}.

🕒 Time left:
    🐶 ${halvingDate.remainingDays} days,
    🐱 ${halvingDate.remainingHours} hours,
    🐭 ${halvingDate.remainingMinutes} minutes,
    🐰 ${halvingDate.remainingSeconds} seconds.
    
🎁 Current block height is ${response.data}
    ⏳ ${halvingDate.blocksRemaining} blocks left.
`,
                {
                    message_thread_id: getThread(ctx.chat.is_forum)
                })
        })
})

bot.command('meme', ctx => {

    fslog(({
        command: 'meme',
        chat: ctx.chat,
        from: ctx.from,
    }))


    const apiUrl = `https://api.giphy.com/v1/gifs/random?tag=bitcoin-halving&api_key=${process.env.IMG_TOKEN}`;

    axios.get(apiUrl)
        .then((response) => {
            const url = response.data.data.images.downsized.url
            bot.telegram.sendAnimation(ctx.chat.id, url, { message_thread_id: getThread(ctx.chat.is_forum) })
        })


})


function getThread(is_topic_message) {
    // return is_topic_message ? ctx.message.message_thread_id : undefined;
    return is_topic_message ? 4707 : undefined;
}

function fslog(entry) {

    const logEntry = {
        timestamp: new Date().toISOString(),
        message: entry,
    };


    // Load existing log entries or create an empty array if the file doesn't exist.
    let logData = [];
    try {
        const logFile = fs.readFileSync('logs.json', 'utf8');
        logData = JSON.parse(logFile);
    } catch (err) {
        // If the file doesn't exist or is invalid JSON, logData will remain an empty array.
    }

    // Append the new log entry to the array.
    logData.push(logEntry);

    // Save the updated log data back to the file.
    try {
        const logJson = JSON.stringify(logData, null, 2);
        fs.writeFileSync('logs.json', logJson);
        console.log('Log entry added and saved successfully.');
    } catch (err) {
        console.error('Error saving log entry:', err);
    }
}

function getHalvingDate(blockHeight) {
    // Define the constants
    const blocksPerHalving = 840000;
    const minutesPerBlock = 9.83;

    // Calculate the blocks remaining until the next halving
    const blocksRemaining = blocksPerHalving - (blockHeight % blocksPerHalving);

    // Calculate the minutes left until the next halving
    const minutesLeft = blocksRemaining * minutesPerBlock;

    // Calculate the date and time of the next halving
    const currentDate = new Date();
    const halvingDate = new Date(currentDate.getTime() + minutesLeft * 60 * 1000);

    // Calculate the remaining days, minutes, and seconds
    const remainingDays = Math.floor(minutesLeft / (60 * 24));
    const remainingHours = Math.floor((minutesLeft % (60 * 24)) / 60);
    const remainingMinutes = Math.floor(minutesLeft % 60);

    const formattedDate = halvingDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
    });


    // Construct the result object
    const result = {
        halvingDate: formattedDate,
        remainingDays,
        remainingHours,
        remainingMinutes,
        remainingSeconds: Math.floor((minutesLeft * 60) % 60),
        blocksRemaining
    };

    return result;
}
