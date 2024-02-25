const { Client, GatewayIntentBits, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const keep_alive = require('./alive.js')
const allowedChannels = ['1142113497216458803'];
const allowedRoles = ['1109770981783908443', '1141758354977460305'];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName('get_key')
    .setDescription('Get a key')
    .toJSON(),
];

const keysFile = 'keys.json';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);

  registerSlashCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, channelId, member } = interaction;
  
  
  if (commandName === 'get_key') {
    const userId = member.user.id;
    const keysData = loadKeysData();

    const userHasKey = Object.values(keysData).includes(userId);
    if (userHasKey) {
      await interaction.reply('You have already been given a key.');
      return;
    }
    
    
  if (!allowedChannels.includes(channelId)) {
  await interaction.reply('This command can only be used in specific channels.');
  return;
}

if (!allowedRoles.some(role => member.roles.cache.has(role))) {
  await interaction.reply('You do not have the required role to use this command.');
  return;
}


    const availableKeys = Object.entries(keysData).filter(([_, value]) => value === null);

    if (availableKeys.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableKeys.length);
      const [key, _] = availableKeys[randomIndex];
      keysData[key] = userId;

      saveKeysData(keysData);

      const user = await client.users.fetch(userId);
      user.send(`Here is your key: ${key}`);
      await interaction.reply('Key sent to your DM.');
    } else {
      await interaction.reply('No keys available at the moment.');
    }
  }
});

function loadKeysData() {
  try {
    const data = fs.readFileSync(keysFile);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading keys file: ${error}`);
    return {};
  }
}

function saveKeysData(keysData) {
  try {
    const data = JSON.stringify(keysData, null, 4);
    fs.writeFileSync(keysFile, data);
  } catch (error) {
    console.error(`Error saving keys file: ${error}`);
  }
}

async function registerSlashCommands() {
  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN); 

  try {
    await rest.put(
      Routes.applicationGuildCommands('1151042067687014400', '1108717001083461733'),
      { body: commands },
    );

    console.log('Registered slash commands successfully!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
}

client.login(process.env.TOKEN);