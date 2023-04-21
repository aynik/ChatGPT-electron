const http = require("http");
const https = require("https");
const fs = require("fs");
const temp = require('temp').track();
const { app } = require("electron");
const ws = require("ws");
const { queue } = require("async")

const HTTP_PORT = 5678;

const CHAT_BRIDGE_GIST = "/aynik/9160a02686e34b114ecfa7bdcbf2f559/raw/chat-bridge.js";

const CHAT_HANDLER_GIST = "/aynik/9160a02686e34b114ecfa7bdcbf2f559/raw/chat-handler.js";

app.on("window-all-closed", () => {
  app.quit();
});

const fetchGistCode = async (gistPath) => {
  return new Promise((resolve, reject) => {
    const value = (Math.random() + 1).toString(36).substring(7);
    https
      .get({
        host: "gist.githubusercontent.com",
        path: gistPath + "?v=" + value,
        options: {
          headers: {
            'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          }
        }
      }, (response) => {
        if (response.statusCode === 200) {
          let jsContent = "";

          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            jsContent += chunk;
          });

          response.on("end", () => {
            resolve(jsContent);
          });
        } else {
          reject(new Error("Error fetching the Gist content"));
        }
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};


const downloadGistToFile = async (gistUrl, filePath) => {
  try {
    const gistCode = await fetchGistCode(gistUrl);
    fs.writeFileSync(filePath, gistCode);
  } catch (error) {
    console.error(`Error downloading the gist to a file: ${error.message}`);
  }
};

const requireDynamic = (path) => {
  delete require.cache[require.resolve(path)];
  return require(path);
};

const serveBridgeGist = async (_, res) => {
  try {
    const gistCode = await fetchGistCode(CHAT_BRIDGE_GIST);
    res.setHeader("Content-Type", "application/javascript");
    res.writeHead(200);
    res.end(gistCode);
  } catch (error) {
    res.writeHead(500);
    res.end(`Error: ${error.message}`);
  }
};

const server = http.createServer(async (req, res) => {
  if (req.url === "/chat-bridge.js") {
    await serveBridgeGist(req, res);
  } else if (req.method === "POST") {
    try {
      const fd = await temp.open({ prefix: 'chat-handler', suffix: '.js' });
      await downloadGistToFile(CHAT_HANDLER_GIST, fd.path);
      const chatHandler = requireDynamic(fd.path)({ ws, queue });
      await chatHandler.handleChatRequest(req, res);
    } catch (error) {
      res.writeHead(500);
      res.end(`Error: ${error.message}`);
    }
  } else {
    res.writeHead(405);
    res.end();
  }
});

server.listen(HTTP_PORT);

app.allowRendererProcessReuse = true;
app.on("ready", () => {
  const window = require("./src/window");
  mainWindow = window.createBrowserWindow(app);

  mainWindow.loadURL(`file://${__dirname}/index.html`, {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36",
  });
});
