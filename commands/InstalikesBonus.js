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
const API_KEY = process.env.YOYOMEDIA_API_KEY || conf.YOYOMEDIA_API_KEY;

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
    return JSON.parse(data);
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

keith({
  nomCom: 'instalikes',
  aliases: ['freelikes', 'instagramlikes'],
  categorie: 'Instagram',
  reaction: '❤️'
}, async (chatId, zk, context) => {
  const { ms, repondre, arg, auteurMessage } = context;
  
  console.log("Instalikes command triggered by:", auteurMessage);

  try {
    // Get the user's phone number (sender)
    const userNumber = auteurMessage.split('@')[0];
    
    // Initial response to show command is working
    await repondre("*🔄 Processing your request...*");

  if (!arg[0]) {
    console.log("No URL provided");
    await repondre(`*Usage:* .instalikes [Instagram post/reel URL]\n\nExample: .instalikes https://www.instagram.com/p/xxxxx`);
    return;
  }
  
  // Log the received URL
  console.log("Processing URL:", arg[0]);

  const instagramLink = arg[0];

  // STEP 1: Check if user has already claimed
  const claimedData = getClaimedUsers();
  if (claimedData.users.some(user => user.number === userNumber)) {
    return repondre(`*❌ You have already claimed your free likes bonus!*\n\nContact the owner at: wa.me/254704897825 for more information.`);
  }

  // STEP 2: Validate Instagram link
  if (!INSTAGRAM_URL_REGEX.test(instagramLink)) {
    return repondre("*❌ Invalid Instagram link!*\n\nPlease provide a valid public Instagram post/reel link.\nMake sure your account is set to public in Instagram settings.");
  }

  // Check if link was already used
  if (claimedData.links.includes(instagramLink)) {
    return repondre(`*❌ This Instagram link has already been used!*\n\nPlease provide a different Instagram post/reel link.`);
  }

  await repondre("*🔍 Validating your Instagram link...*");

  try {
    await repondre("*🔄 Processing your request...*");
    
    // Validate if link is accessible
    const validateResponse = await axios.get(instagramLink, {
      timeout: 10000,
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });
    if (validateResponse.status !== 200) {
      return repondre("*❌ Error:* The Instagram link appears to be invalid or inaccessible.\nPlease ensure your account is public and the post exists.");
    }

    // Get screenshot
    const screenshotUrl = `https://api.screenshotmachine.com?key=${API_KEY}&url=${encodeURIComponent(instagramLink)}&dimension=1024x768`;

    // Send screenshot preview
    await zk.sendMessage(chatId, {
      image: { url: screenshotUrl },
      caption: "*✅ Instagram Post Verified!*\nProcessing your free likes...",
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

    // STEP 3: Grant the offer
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'add');
    formData.append('service', SERVICE_ID);
    formData.append('link', instagramLink);
    formData.append('quantity', QUANTITY);

    const response = await axios.post(API_URL, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.order) {
      // STEP 4: Save to claimed database
      saveClaimedData({
        number: userNumber,
        orderId: response.data.order,
        date: new Date().toISOString()
      }, instagramLink);

      await zk.sendMessage(chatId, {
        text: `*🎉 Congratulations! Your free Instagram likes have been granted!*\n\n✅ Order ID: ${response.data.order}\n👤 Post: ${instagramLink}\n❤️ Quantity: ${QUANTITY} likes\n\nContact owner at: wa.me/254704897825 to purchase more likes!`,
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
    } else {
      repondre("*❌ Error:* Failed to process likes. Please try again later or contact the owner.");
    }
  } catch (error) {
    console.error("Command execution error:", error);
    await repondre(`*❌ Error:* ${error.message}\n\nPlease ensure:\n1. Your Instagram link is valid\n2. Your account is public\n3. The post/reel exists`);
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
    
    if (claimedUsers.users.length === 0) {
      return repondre("*No users have claimed free likes yet.*");
    }
    
    // Format the list of claimed users
    let message = `*Users Who Claimed Free Instagram Likes*\n\n`;
    claimedUsers.users.forEach((user, index) => {
      message += `*${index + 1}. User:* ${user.number}\n`;
      message += `   *Order ID:* ${user.orderId}\n`;
      message += `   *Date:* ${new Date(user.date).toLocaleString()}\n\n`;
    });
    
    message += `Total: ${claimedUsers.users.length} users`;
    
    // Send the file as a document
    fs.writeFileSync('claimed-users-report.txt', message);
    
    await zk.sendMessage(chatId, {
      document: fs.readFileSync('claimed-users-report.txt'),
      fileName: 'claimed-users-report.txt',
      mimetype: 'text/plain',
      caption: `*Free Instagram Likes - Claimed Users Report*\n\nTotal: ${claimedUsers.users.length} users`
    }, { quoted: ms });
    
    // Clean up temporary file
    fs.unlinkSync('claimed-users-report.txt');
    
  } catch (error) {
    console.error("Error processing claimed users:", error);
    repondre("*Error:* Failed to retrieve the list of claimed users.");
  }
});