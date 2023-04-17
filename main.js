const http = require("http"),
  WebSocket = require("ws"),
  { queue } = require("async"),
  { app } = require("electron");

const WS_PORT = 1234;
const HTTP_PORT = 5678;

const GPT_40_MODEL = "gpt-4";
const GPT_35_MODEL = "text-davinci-002-render-sha";

app.on("window-all-closed", () => {
  app.quit();
});

const q = queue(async (task) => {
  return new Promise((resolve, reject) => {
    task().then(resolve).catch(reject);
  });
}, 1);

const addToQueue = (asyncFn) =>
  new Promise((resolve, reject) => {
    q.push(() => asyncFn().then(resolve).catch(reject));
  });

const pipeToResponse = (req, res, options = {}) =>
  new Promise(async (resolve, reject) => {
    try {
      res.setHeader("Content-Type", "text/plain; charset=UTF-8");
      res.setHeader("Transfer-Encoding", "chunked");

      const reqBodyBuffers = [];
      for await (const chunk of req) {
        reqBodyBuffers.push(chunk);
      }
      const reqBody = Buffer.concat(reqBodyBuffers).toString();
      const server = new WebSocket.Server({ port: WS_PORT });

      server.on("connection", (socket) => {
        let storedData = "",
          previousData = "";

        socket.on("message", (message) => {
          const parsedMessage = JSON.parse(message);
          switch (parsedMessage.type) {
            case "connected":
              if (!options.isContinue) {
                socket.send(
                  JSON.stringify({
                    type: "load",
                    data: options.modelName || GPT_35_MODEL,
                  })
                );
                break;
              }
            case "loaded":
              socket.send(
                JSON.stringify({
                  type: "text",
                  data: reqBody,
                })
              );
              break;
            default:
              storedData = parsedMessage.data.replace(/\u200B/g, "");
              res.write(storedData.slice(previousData.length));
              previousData = storedData;
              if ("end" === parsedMessage.type) {
                socket.terminate();
                server.close();
                resolve();
              }
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });

const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    if (req.url === "/chat") {
      await addToQueue(() => pipeToResponse(req, res));
    } else if (req.url === "/chat-continue") {
      await addToQueue(() => pipeToResponse(req, res, { isContinue: true }));
    } else if (req.url === "/chat-4") {
      await addToQueue(() =>
        pipeToResponse(req, res, {
          modelName: GPT_40_MODEL,
        })
      );
    } else if (req.url === "/chat-continue-4") {
      await addToQueue(() =>
        pipeToResponse(req, res, {
          modelName: GPT_40_MODEL,
          isContinue: true,
        })
      );
    } else {
      res.writeHead(404);
    }
  } else {
    res.writeHead(405);
  }
  res.end();
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
