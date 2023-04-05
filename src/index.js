const path = require('path');
const fs = require('fs');
const axios = require('..\\node_modules\\axios\\dist\\node\\axios.cjs');
const pngToIco = require('png-to-ico');

const url = process.argv[2];

if (!url) {
    console.error('Please specify a url.');
    process.exit(1);
}

async function createShortcut() {
    const placeId = url.match(/[0-9]+/)[0];

    const universeIdPromise = axios.get(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    const universeId = (await universeIdPromise).data.universeId;

    const gameNamePromise = axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
    const gameName = (await gameNamePromise).data.data[0].name.replace(/[^a-zA-Z ]/g, "");

    //Get game icon as ico
    const iconUrlPromise = axios.get(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`);
    const iconUrl = (await iconUrlPromise).data.data[0].imageUrl;

    const iconsPath = `./gameicons/${gameName}`;

    if (!fs.existsSync('./gameicons')) {
        fs.mkdirSync('./gameicons');
    }

    await axios({ method: "get", url: iconUrl, responseType: "stream" })
        .then((resp) => {
            const writeStream = fs.createWriteStream(`temp.png`);
            resp.data.pipe(writeStream);

            writeStream.on('finish', async () => {
                try {
                  const buf = await pngToIco(`temp.png`);
                  fs.writeFileSync(`${iconsPath}.ico`, buf);
                } catch (error) {
                  console.error('Error converting PNG to ICO:', error);
                }
              });
        })

    const shortcutPath = path.join(process.env.USERPROFILE, 'Desktop', `${gameName}.url`); // Set the path for the URL shortcut
    const shortcutContent = `[InternetShortcut]\nURL=roblox://placeID=${placeId}/\nIconIndex=0\nHotKey=0\nIDList=\nIconFile=${path.resolve(iconsPath)}.ico`; // Set the content for the URL shortcut

    fs.writeFileSync(shortcutPath, shortcutContent); // Write the URL shortcut file to disk
    console.log(`Shortcut created: ${shortcutPath}`);
}

createShortcut();