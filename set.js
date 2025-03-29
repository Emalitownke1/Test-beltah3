const fs = require('fs-extra');
const { Sequelize } = require('sequelize');
if (fs.existsSync('set.env'))
    require('dotenv').config({ path: __dirname + '/set.env' });
const path = require("path");
const databasePath = path.join(__dirname, './database.db');
const DATABASE_URL = process.env.DATABASE_URL === undefined
    ? databasePath
    : process.env.DATABASE_URL;
module.exports = { session: process.env.SESSION_ID || 'BELTAH-MD;;;=>eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiT0xUWG5ER1I3RldzalYyWlFCYnQ1eGQwbW00d3BSalpiUThRRVhmbElXUT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiUGovZ24vQVRaalFvSFhpZU9TSEx1RmpuaVBnK3pzeS9yOGh1eDk3aG1YZz0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJhRm9GcjNkaEkxK0xRYVlDRU5pc1M0TmFKRjMzcDlJU0pIcUpZQXZnTjNFPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJnV2dPc3FxU3Aya0VoNFdMWUN6R3hPK2hqdlgzWXV6ZUc1K2xhWlMxam1NPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IitLaTRpbmR1SHdjZFEzbXlBOUZVeVA0SFpjQ1BlWlMwMWR2VitLWnFHVUU9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlRuS1N4ZWpqS0pvdHpWUlRNUGdZc21kc0RFby8yV1hxOEEwY2pkSGRZSGs9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiUU8xbmxvZ2RBRUc5eFd2REJacWRFZUR4eUdQUVFvek1BZEQzYXM1RWlIMD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiTUFCb1dkeEZzbmlnYmthYjd4WXdBQ3d6L2E5TWxvME0vNWZpRi9JakZ6OD0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkhsK3JueFdsUjdyZnZGQVZldnJMdFZFalBYdHJyTVFOOFA4Sk9uL2VFUTd0SExPRytGM2tiNW83QlYrTE0vc3g1TUpkN2ppakVWZklmM0dualRPRkR3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjEsImFkdlNlY3JldEtleSI6IjNObndYRHRsRGdmemRVZkx0SU9EOEEzeGlISnR3UkQ1Qm1TR2tPY0FLU3c9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbeyJrZXkiOnsicmVtb3RlSmlkIjoiMjU0NzA0ODk3ODI1QHMud2hhdHNhcHAubmV0IiwiZnJvbU1lIjp0cnVlLCJpZCI6IjYzRjQxMTUxODBDMTg0RTgwNDY4QjUxM0NCMEQxRkEzIn0sIm1lc3NhZ2VUaW1lc3RhbXAiOjE3NDExMjg3NTB9XSwibmV4dFByZUtleUlkIjozMSwiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjMxLCJhY2NvdW50U3luY0NvdW50ZXIiOjAsImFjY291bnRTZXR0aW5ncyI6eyJ1bmFyY2hpdmVDaGF0cyI6ZmFsc2V9LCJkZXZpY2VJZCI6IkM2WGw0M1U3UXBtQS0xQk1VR1dzaEEiLCJwaG9uZUlkIjoiNGUyYTRmNWItZThkNy00MWMzLTg0N2ItNjNhYzgxNzE4NjdjIiwiaWRlbnRpdHlJZCI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IllhenFScUxjRVFpTHMvTTMxY3M1SmhPRXIyRT0ifSwicmVnaXN0ZXJlZCI6dHJ1ZSwiYmFja3VwVG9rZW4iOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJ3VEtGOE9mRmxiSUZFS24yakJOaHVhdFNzbFU9In0sInJlZ2lzdHJhdGlvbiI6e30sInBhaXJpbmdDb2RlIjoiSEg2MkNRNEwiLCJtZSI6eyJpZCI6IjI1NDcwNDg5NzgyNTo1MkBzLndoYXRzYXBwLm5ldCIsIm5hbWUiOiJOaWNob2wgVGVzbGEifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0lTV25QY0RFSnlJbnI0R0dBRWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6ImJlUDJ2TTE5K1JCK3drNWlNQzE1QlJjdWVuSzM2Y1UzVlZ1QjJUYXY4WEk9IiwiYWNjb3VudFNpZ25hdHVyZSI6IlVldS9Dcm9KeGdTVkFudExiRm96YkJ4NWxjUUpEbytMTTNsRHlRclp2b2pSa3E4MFpqd1dYRVQ2N1ZoMzhiRDF3ZGRQOGhDb211c0NVcnF5VUQydkFnPT0iLCJkZXZpY2VTaWduYXR1cmUiOiIrWmJTOEVHeS9jZ3lQQWpGODExN3BQVTIxeFZrNFh4d25GcGZDdHpqOUUxVXdvYjN6L081a0Fic1Vzb1JEYlVzeUdpQ3NkL1JXR0k5MFZMSzNOczZDdz09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6IjI1NDcwNDg5NzgyNTo1MkBzLndoYXRzYXBwLm5ldCIsImRldmljZUlkIjowfSwiaWRlbnRpZmllcktleSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkJXM2o5cnpOZmZrUWZzSk9ZakF0ZVFVWExucHl0K25GTjFWYmdkazJyL0Z5In19XSwicGxhdGZvcm0iOiJzbWJhIiwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzQxMTI4NzQ2LCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUhPNiJ9',
    PREFIXE: process.env.PREFIX || ".",
    GITHUB : process.env.GITHUB|| 'https://github.com/Beltah254/BELTAH-MD',
    OWNER_NAME : process.env.OWNER_NAME || "Beltah254",
    NUMERO_OWNER : process.env.NUMERO_OWNER || "254704897825",  
              
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "yess",
    AUTO_DOWNLOAD_STATUS: process.env.AUTO_DOWNLOAD_STATUS || 'non',
    AUTO_REACT: process.env.AUTO_REACTION || "yes",  
    URL: process.env.URL || "https://files.catbox.moe/nxl93r.jpg",  
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS || 'yes',              
    EMOJIS: process.env.EMOJIS || "👻,☺️,❤️,🦚",              
    AUTO_READ_MESSAGES: process.env.AUTO_READ_MESSAGES || "yes",
    AUTO_BLOCK: process.env.AUTO_BLOCK || 'no', 
    GCF: process.env.GROUP_CONTROL || 'no', 
    GREET : process.env.GREET || "no",            
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || 'viewed by Trekker2',   
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || 'no',
    AUTOBIO: process.env.AUTOBIO || 'no',       
    ANTICALL_MSG : process.env.ANTICALL_MESSAGE || '',             
    GURL: process.env.GURL  || "https://whatsapp.com/channel/0029VAUSV0PFCCOSB5TX9C1F",
    EVENTS :process.env.EVENTS || "yes",
    CAPTION : process.env.CAPTION || "BELTAH-MD",
    BOT : process.env.BOT_NAME || '𝗕𝗘𝗟𝗧𝗔𝗛-𝗠𝗗',
    MODE: process.env.PUBLIC_MODE || "yes",              
    TIMEZONE: process.env.TIMEZONE || "Africa/Nairobi", 
    PM_PERMIT: process.env.PM_PERMIT || 'no',
    HEROKU_APP_NAME : process.env.HEROKU_APP_NAME || null,
    HEROKU_API_KEY : process.env.HEROKU_API_KEY || null,
    WARN_COUNT : process.env.WARN_COUNT || '3' ,
    ETAT : process.env.PRESENCE || '1',
    DP : process.env.STARTING_BOT_MESSAGE || "no",
    ADM : process.env.ANTI_DELETE_MESSAGE || 'no',
    ANTICALL: process.env.ANTICALL || 'yes',
    YOYOMEDIA_API_KEY: process.env.YOYOMEDIA_API_KEY || 'fec208398d31ad017dddebcb740dc49ce8495ad5801396b5b260ce25b0292eab',
    DATABASE_URL,
    DATABASE: DATABASE_URL === databasePath
        ? "postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2" : "postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2",
    /* new Sequelize({
     dialect: 'sqlite',
     storage: DATABASE_URL,
     logging: false,
})
: new Sequelize(DATABASE_URL, {
     dialect: 'postgres',
     ssl: true,
     protocol: 'postgres',
     dialectOptions: {
         native: true,
         ssl: { require: true, rejectUnauthorized: false },
     },
     logging: false,
}),*/
};
let fichier = require.resolve(__filename);
fs.watchFile(fichier, () => {
    fs.unwatchFile(fichier);
    console.log(`mise à jour ${__filename}`);
    delete require.cache[fichier];
    require(fichier);
});
