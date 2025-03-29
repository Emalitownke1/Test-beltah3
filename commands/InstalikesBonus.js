
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
      fs.writeFileSync(CLAIMED_USERS_FILE, JSON.stringify({ users: [], links: [] }));
      return { users: [], links: [] };
    }
    const data = fs.readFileSync(CLAIMED_USERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      users: parsed.users || [],
      links: parsed.links || []
    };
  } catch (error) {
    console.error('Error reading claimed users file:', error);
    return { users: [], links: [] };
  }
};

// Helper function to save claimed data
const saveClaimedData = (user, link) => {
  try {
    const claimedData = getClaimedUsers();
    claimedData.users.push(user);
    claimedData.links.push(link);
    fs.writeFileSync(CLAIMED_USERS_FILE, JSON.stringify(claimedData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving claimed data:', error);
    return false;
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
  
  // Initial response to show command is working
  await repondre("*Processing your request...* 🔄");

  // Validate the Instagram URL format
  if (!INSTAGRAM_URL_REGEX.test(instagramLink)) {
    return repondre("*Invalid Instagram link.* Please provide a valid public Instagram post or reel link.\n\nExample: https://www.instagram.com/p/xxxxx");
  }

  try {
    // Check if the link is accessible
    await repondre("*Validating Instagram link...* 🔍");
    
    try {
      const validateResponse = await axios.get(instagramLink, {
        timeout: 10000,
        validateStatus: (status) => status === 200
      });
    } catch (error) {
      return repondre("*Error:* The Instagram link appears to be invalid or not accessible. Make sure:\n\n1. The link is correct\n2. The post is public\n3. The post still exists");
    }

    // Take screenshot using Puppeteer API
    const screenshotUrl = `https://api.screenshotmachine.com?key=yourkey&url=${encodeURIComponent(instagramLink)}&dimension=1024x768&delay=2000`;
    
    // Send screenshot to chat
    await zk.sendMessage(chatId, {
      image: { url: screenshotUrl },
      caption: "*Instagram Post Preview*\nLink validation successful ✅",
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
  
  // Check if the user or link has already been claimed
  const claimedData = getClaimedUsers();
  const userClaimed = claimedData.users.some(user => user.number === userNumber);
  const linkClaimed = claimedData.links.some(link => link === instagramLink);
  
  if (userClaimed) {
    return repondre(`*You have already claimed your free likes bonus!* 🚫\n\nContact the owner at: wa.me/254704897825 for more information.`);
  }

  if (linkClaimed) {
    return repondre(`*This Instagram link has already been used!* 🚫\n\nPlease provide a different Instagram post/reel link.`);
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
      // Save both user and link as claimed in the database
      saveClaimedData({
        number: userNumber,
        orderId: data.order,
        date: new Date().toISOString()
      }, instagramLink);
      
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
    if (error.response && error.response.data && error.response.data.error) {
      return repondre(`*Error:* ${error.response.data.error}`);
    }
    return repondre("*Error:* Unable to process your request at the moment. Please try again in a few minutes.");
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
