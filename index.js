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
        update: ctx.update,
        telegram: ctx.telegram,
    }))
    const topic_id = ctx.message.is_topic_message ? ctx.message.message_thread_id : undefined;
    bot.telegram.sendMessage(ctx.chat.id, `Hello there ${ctx.from.first_name}! Welcome to halving reminder 😎. Este bot es exclusivo de cypherplatxs, parcerxs. Type /reminder to get the date.`, {
        message_thread_id: 4707
    })
})


bot.command('reminder', ctx => {
    fslog(({
        command: 'reminder',
        update: ctx.update,
        telegram: ctx.telegram,
    }))

    axios.get('https://blockchain.info/q/getblockcount')
        .then(response => {
            let halvingDate = getHalvingDate(response.data)
            const topic_id = ctx.message.is_topic_message ? ctx.message.message_thread_id : undefined;
            bot.telegram.sendMessage(ctx.chat.id,
                `Next halving is happening on ${halvingDate.halvingDate} time left is ${halvingDate.remainingDays} days, ${halvingDate.remainingHours} hours, ${halvingDate.remainingMinutes} minutes and ${halvingDate.remainingSeconds} seconds.`,
                {
                    message_thread_id: 4707
                })
        })
})

function get_forum(params) {

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

    // Construct the result object
    const result = {
        halvingDate,
        remainingDays,
        remainingHours,
        remainingMinutes,
        remainingSeconds: Math.floor((minutesLeft * 60) % 60),
    };

    return result;
}
