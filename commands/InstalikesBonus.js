
const { keith } = require('../keizzah/keith');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const conf = require('../set');

// Path to the JSON file storing claimed users
const CLAIMED_USERS_FILE = path.join(__dirname, '../database/claimed_users.json');

// Instagram URL validation regex
const INSTAGRAM_URL_REGEX = /https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([^/?#&]+)/;

// YoYoMedia API Configuration
const API_URL = 'https://yoyomedia.in/api/v2';
const API_KEY = process.env.YOYOMEDIA_API_KEY || conf.YOYOMEDIA_API_KEY || 'fe5714fe99697f402b7ebffb1a04336b7b197336b0f1fc466097e0afdfddee86';

// Service ID and quantity for likes
const SERVICE_ID = 11105;
const QUANTITY = 15;

// Helper function to read the claimed users file
const getClaimedUsers = () => {
  try {
    if (!fs.existsSync(CLAIMED_USERS_FILE)) {
      fs.writeFileSync(CLAIMED_USERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(CLAIMED_USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading claimed users file:', error);
    return [];
  }
};

// Helper function to save a new claimed user
const saveClaimedUser = (user) => {
  try {
    const claimedUsers = getClaimedUsers();
    claimedUsers.push(user);
    fs.writeFileSync(CLAIMED_USERS_FILE, JSON.stringify(claimedUsers, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving claimed user:', error);
    return false;
  }
};

// Main .instalikes command
keith({
  nomCom: 'instalikes',
  aliases: ['freelikes', 'instagramlikes'],
  categorie: 'Instagram',
  reaction: '❤️'
}, async (chatId, zk, context) => {
  const { ms, repondre, arg, auteurMessage } = context;
  
  // Get the user's phone number (sender)
  const userNumber = auteurMessage.split('@')[0];
  
  // Get the Instagram link from arguments
  if (!arg[0]) {
    return repondre(`*Usage:* .instalikes [Instagram post/reel URL]\n\nExample: .instalikes https://www.instagram.com/p/xxxxx`);
  }
  
  const instagramLink = arg[0];
  
  // Validate the Instagram URL format
  if (!INSTAGRAM_URL_REGEX.test(instagramLink)) {
    return repondre("*Invalid Instagram link.* Please provide a valid public Instagram post or reel link.\n\nNote: Make sure your account is set to public in Instagram settings.");
  }
  
  // Check if the user has already claimed the free likes
  const claimedUsers = getClaimedUsers();
  const alreadyClaimed = claimedUsers.some(user => user.number === userNumber);
  
  if (alreadyClaimed) {
    return repondre(`*You have already claimed your free likes bonus!* 🚫\n\nContact the owner at: wa.me/254704897825 for more information.`);
  }
  
  // Show processing message
  await repondre("*Processing your free likes request...* ⏳");
  
  try {
    // Place the order via YoYoMedia API
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'add');
    formData.append('service', SERVICE_ID);
    formData.append('link', instagramLink);
    formData.append('quantity', QUANTITY);
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    if (data.order) {
      // Save the user as claimed in the database
      saveClaimedUser({
        number: userNumber,
        link: instagramLink,
        orderId: data.order,
        date: new Date().toISOString()
      });
      
      // Send success message
      await zk.sendMessage(chatId, {
        text: `*🎉 Congratulations! You have received your free Instagram likes!*\n\n✅ Order ID: ${data.order}\n👤 For your Instagram post: ${instagramLink}\n❤️ Quantity: ${QUANTITY} likes\n\nContact owner at: wa.me/254704897825 for more information.`,
        contextInfo: {
          externalAdReply: {
            title: "Instagram Free Likes",
            body: "BELTAH-MD BOT",
            thumbnailUrl: conf.URL,
            sourceUrl: conf.GURL,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: ms });
      
    } else if (data.error) {
      repondre(`*Error:* ${data.error}\n\nPlease try again or contact the owner.`);
    }
    
  } catch (error) {
    console.error("Error placing order:", error);
    repondre("*Error:* Failed to process your request. Please ensure your Instagram account is public and try again later.");
  }
});

// Command to view claimed users (owner only)
keith({
  nomCom: 'claimedusers',
  aliases: ['viewclaimed', 'freelikeusers'],
  categorie: 'Owner',
  reaction: '📋'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  try {
    const claimedUsers = getClaimedUsers();
    
    if (claimedUsers.length === 0) {
      return repondre("*No users have claimed free likes yet.*");
    }
    
    // Format the list of claimed users
    let message = `*Users Who Claimed Free Instagram Likes*\n\n`;
    claimedUsers.forEach((user, index) => {
      message += `*${index + 1}. User:* ${user.number}\n`;
      message += `   *Link:* ${user.link}\n`;
      message += `   *Order ID:* ${user.orderId}\n`;
      message += `   *Date:* ${new Date(user.date).toLocaleString()}\n\n`;
    });
    
    message += `Total: ${claimedUsers.length} users`;
    
    // Send the file as a document
    fs.writeFileSync('claimed-users-report.txt', message);
    
    await zk.sendMessage(chatId, {
      document: fs.readFileSync('claimed-users-report.txt'),
      fileName: 'claimed-users-report.txt',
      mimetype: 'text/plain',
      caption: `*Free Instagram Likes - Claimed Users Report*\n\nTotal: ${claimedUsers.length} users`
    }, { quoted: ms });
    
    // Clean up temporary file
    fs.unlinkSync('claimed-users-report.txt');
    
  } catch (error) {
    console.error("Error processing claimed users:", error);
    repondre("*Error:* Failed to retrieve the list of claimed users.");
  }
});
