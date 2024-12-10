const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
import axios from 'axios';
// import qrcodeTerminal from 'qrcode-terminal';
// import express from 'express';

// const app = express();


// Save state to a file
function saveState(state:{}) {
    fs.writeFileSync('state.json', JSON.stringify(state));
}
async function downloadQRCode() {
    const url = 'https://whatsapp-bot-r5vm.onrender.com/qr-code.png';
    const filePath = path.resolve(__dirname, 'qr-code.png');
  
    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream', // This is necessary to handle the binary file
      });
  
      const writer = fs.createWriteStream(filePath);
  
      response.data.pipe(writer);
  
      writer.on('finish', () => {
        console.log('QR code downloaded successfully');
      });
  
      writer.on('error', (err:any) => {
        console.error('Error downloading the QR code', err);
      });
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  }

  
// Load state from a file
function loadState() {
    if (fs.existsSync('state.json')) {
        return JSON.parse(fs.readFileSync('state.json'));
    }
    else{
        return {
            "on": true,
            "viewOnce": true
        }
    }
}

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'client1234'
    }),
    puppeteer: {
        headless: true, // Set to true for production
    },
});
client.on('qr', async (qr: any) => {
    // Log the QR code to the console as a diagram
    console.log('QR RECEIVED', qr);
    // qrcodeTerminal.generate(qr, { small: true });

    // Generate and save the QR code as an image file
    try {
        await QRCode.toFile('qr-code.png', qr, {
            color: {
                dark: '#000000',  // Black dots
                light: '#FFFFFF'  // White background
            }
        });

        // Simulate downloa
        console.log(`Download your QR code here: ${process.env.url}/qr-code.png`);
        console.log('QR Code saved as qr-code.png!');
        // app.listen(3000, '0.0.0.0', () => {
        //     console.log(`Server is running on port ${3000}`);
        // });
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
});

// Event when the client is ready
client.on('ready', async () => {
    console.log('Bot is ready!');
});


client.on('authenticated', () => {
    console.log('Authenticated successfully!');
});
client.on('auth_failure', (message: any) => {
    console.error('Authentication failed:', message);
});
client.on('disconnected', (reason : any) => {
    console.log('Client was disconnected:', reason);
});


// Event to handle incoming messages
client.on('message', async (message:any) => {

    let state = loadState();
    let viewOnce = state.viewOnce;
    
    if (message.hasMedia && message.isViewOnce && viewOnce == true && message.fromMe == false && message.size < 10485760) {
        const media = await message.downloadMedia();
        const filePath = path.join(__dirname, 'view_once_media');
        fs.writeFileSync(filePath, media.data, { encoding: 'base64' });
        
        const chatId = '2349164187495@c.us';
        await client.sendMessage(chatId, fs.readFileSync(filePath), {
            caption: message.caption,
        });

        await client.sendMessage(message.from, fs.readFileSync(filePath), {
            caption: message.caption,
            quotedMessageId: message.id._serialized,
        });
    }
});

client.on('message_create', async (message:any) => {
    // Log outgoing messages
    let isOn = loadState();
    let chatId = message.isGroupMsg ? message.from : message.to;

    if (message.body == '#bot wake up son') {
        let json = loadState();
        json.on = true;
        saveState(json);
    
        let replyMessage = 'Hello sir, how can I help you? 🤖'; 
        
    
        await client.sendMessage(chatId, replyMessage, {
            quotedMessageId: message.id._serialized // Refer to the original message ID
        });
    }
    if(message.body == '#bot die'){
        let json = loadState();
        json.on = false;
        let replyMessage = 'Bye Bye. 🤖😓';

        
        await client.sendMessage(chatId, replyMessage, {
            quotedMessageId: message.id._serialized // Refer to the original message ID
        });
        saveState(json)
    }
    if(isOn.on == true){
        if (message.fromMe) {
            try {
            if(message.body.startsWith('#')){
                await message.react('🤖');
            }
            if(message.body == '#antiviewonce'){
                let json = loadState()
                json.viewOnce = true;
                saveState(json);
                let replyMessage = 'View once on. 🤖';
                

                await client.sendMessage(chatId, replyMessage, {
                    quotedMessageId: message.id._serialized // Refer to the original message ID
                });

                throw new Error('');
            }
            else if(message.body == '#viewonce'){
                let json = loadState();
                json.viewOnce = false;
                let replyMessage = 'View once off. 🤖😓';
                

                await client.sendMessage(chatId, replyMessage, {
                    quotedMessageId: message.id._serialized // Refer to the original message ID
                });
                saveState(json);

                throw new Error('');
            }
            else if(message.body == '#record'){
                const chat = await message.getChat();
    
                await chat.sendStateRecording();

                throw new Error('');
            }
            else if(message.body == '#type'){
                const chat = await message.getChat();
    
                await chat.sendStateTyping();

                throw new Error('');
            }
            else if(message.body == '#clear'){
                const chat = await message.clearState();
    
                await chat.sendStateTyping();

                throw new Error('');
            }
            else if(message.body == '#star'){
                if(message.hasQuotedMsg){
                    const quotedMessage = await message.getQuotedMessage();
                    await quotedMessage.star();

                    throw new Error('');
                }
            }
            else if(message.body == '#sticker'){
                if(message.hasQuotedMsg){
                    
                    const quotedMessage = await message.getQuotedMessage();
                    if(quotedMessage.hasMedia){

                        const media = await quotedMessage.downloadMedia();
                    
                        await client.sendMessage(chatId, media, {
                            sendMediaAsSticker: true
                        });
                        throw new Error('');
                    }
                }
                else{
                    let replyMessage = 'No message tagged. 🤖';
                    
                    await client.sendMessage(chatId, replyMessage, {
                        quotedMessageId: message.id._serialized
                    });
                }
            }
            else if(message.body == '#pin'){
                if(message.hasQuotedMsg){
                    let replyMessage = 'Pinning message feature coming soon. 🤖';
                    

                    await client.sendMessage(chatId, replyMessage, {
                        quotedMessageId: message.id._serialized
                    });
                }
                else{
                    const chat = await message.getChat();
    
                    if(chat.pinned){
                        await chat.unpin();
                    }
                    else{
                        await chat.pin();
                    }
                }

                throw new Error('');
            }
            else if(message.body == '#save'){

                let state = loadState();
                let viewOnce = state.viewOnce;

                const quotedMessage = await message.getQuotedMessage();
                
                    if(viewOnce == true){
                        console.log(quotedMessage);
                        const media = await quotedMessage.downloadMedia();
                    

                        // await client.sendMessage(chatId, fs.readFileSync(filePath), {
                        //     caption: quotedMessage.caption,
                        // });
                
                        await client.sendMessage(chatId, media, {
                            caption: quotedMessage.caption,
                            quotedMessageId: message.id._serialized,
                        });
                    }
                throw new Error('');
            }
            else if(message.body == '#tagall'){
                const chat = await message.getChat();
                console.log(chat.isGroup, chat.to);
                if (chat.isGroup) {
                    // Check if the bot has permission to mention all participants
                    const mentions = chat.participants.map((participant:any) => {
                        return {
                            id: participant.id._serialized,  // Correctly format the participant ID
                            notify: participant.id.user     // The user ID for the mention
                        };
                    });
            
                    // Format the mention text with all user IDs
                    const mentionText = mentions.length > 0 ? `@${mentions.map((participant:any) => participant.notify).join(', @')}!` : 'No participants to mention.';
            
                    // Send the mention message
                    await chat.sendMessage(mentionText, {
                        mentions: mentions.map((participant:any) => participant.id)
                    });
                } else {
                    await chat.sendMessage('This is not a group, sir. How can I help you? 🙇🏾‍♂️🤖');
                }
                throw new Error('')
            }
            } catch (error) {
                
            }
        }
    }
});


client.on('error', (error:any) => {
    console.error('Error: ', error);
});


// Initialize the client
client.initialize();
