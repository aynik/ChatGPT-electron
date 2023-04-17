const webview = document.getElementById("webview");
webview.addEventListener("dom-ready", function () {
  webview.executeJavaScript(`
    (() => {
      let websocket, currentElement, isMonitoring;

      const initializeWebSocket = () => {
        try {
          websocket = new WebSocket("ws://localhost:1234");
          websocket.addEventListener("open", onOpen);
          websocket.addEventListener("message", onMessage);
        } catch (_) {}
      };

      const onOpen = (event) => {
        console.log("Connected:", event);
        send(
          websocket,
          localStorage.getItem("isLoading") === "1" ? "loaded" : "connected"
        );
        localStorage.setItem("isLoading", "0");
      };

      const onMessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type == "load") return loadModel(message.data);
        if (message.type == "text") return setText(message.data);
      };

      const setText = (text) => {
        const textarea = document.querySelector("textarea"),
          button = textarea.parentElement.querySelector("button");
        textarea.value = text;
        button.disabled = false;
        button.click();
        startMonitoring();
        waitForSvg(button, () => {
          isMonitoring = false;
          send(websocket, "end", currentElement.innerText);
          currentElement = undefined;
        });
      };

      const loadModel = (model) => {
        localStorage.setItem("isLoading", "1");
        const value = (Math.random() + 1).toString(36).substring(7);
        window.location.replace("/chat?model=" + model + "&v=" + value);
      };

      const send = (websocket, messageType, messageData) => {
        if (websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({ type: messageType, data: messageData }));
        }
      };

      const startMonitoring = () => {
        isMonitoring = true;
        let previousText = "";
        const checkElement = () => {
          if (isMonitoring) {
            currentElement = Array.from(
              document.querySelectorAll(".markdown")
            ).pop();
            currentElement
              ? setTimeout(monitorText, 500)
              : setTimeout(checkElement, 500);
          }
        };
        const monitorText = () => {
          if (isMonitoring) {
            const newText = currentElement.innerText.slice(0, -10);
            if (newText !== previousText) {
              send(websocket, "text", newText);
            }
            previousText = newText;
            setTimeout(monitorText, 500);
          }
        };
        setTimeout(checkElement, 500);
      };

      const waitForSvg = (button, callback) => {
        const checkSvg = () => {
          button.querySelector("svg")
            ? setTimeout(callback, 500)
            : setTimeout(checkSvg, 500);
        };
        setTimeout(checkSvg, 2000);
      };

      const keepAlive = () => {
        setInterval(() => {
          if (!websocket || websocket.readyState === WebSocket.CLOSED) {
            initializeWebSocket();
          }
        }, 500);
      };

      keepAlive();
    })();
  `);
});
