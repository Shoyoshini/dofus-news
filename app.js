// Import of environment variables.
require('dotenv').config();

// Import of modules.
const { get, default: axios } = require('axios');
const { Client, Intents } = require('discord.js');
const { existsSync, writeFileSync, readFileSync } = require('fs');

// Definition of global variables.
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const tweetsSent = getSentTweets();
let channel;

/**
 * Get the latest tweets from Dofus and post them on Discord.
 */
async function fetchTweets() {
    const headers = {
        Authorization: `Bearer ${process.env.BEARER_TOKEN}`
    };

    try {
        const res = await get('https://api.twitter.com/2/tweets/search/recent?query=from:DOFUSfr&max_results=100&tweet.fields=in_reply_to_user_id', { headers });
        const tweets = res.data.data.filter(tweet => !tweet.in_reply_to_user_id).reverse();

        for (const tweet of tweets) {
            if (tweetsSent.includes(tweet.id)) continue;

            try {
                channel.send(`https://twitter.com/DOFUSfr/status/${tweet.id}`);
                tweetsSent.push(tweet.id);
            } catch (err) {
                console.error(err);
            }
        }

        setSentTweets(tweetsSent);
    } catch (err) {
        console.error(err);
    }
}

/**
 * Get the list of tweets already sent or create a new list.
 * @returns {Array} List of tweets already sent.
 */
function getSentTweets() {
    if (!existsSync('./tweets.json')) return [];
    const tweets = readFileSync('./tweets.json', 'utf-8');
    return JSON.parse(tweets);
}

/**
 * Replaces the old list of tweets with a new one.
 * @param {Array} tweets New list to write to the file.
 */
function setSentTweets(tweets) {
    writeFileSync('./tweets.json', JSON.stringify(tweets));
}

// This event is called once the Discord client is connected.
client.once('ready', async () => {
    channel = await client.channels.fetch(process.env.CHANNEL_ID);
    fetchTweets();
    setInterval(fetchTweets, 30000);
});

// Connect the Discord client.
client.login(process.env.DISCORD_TOKEN).catch(console.error);