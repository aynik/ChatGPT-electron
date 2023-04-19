const webview = document.getElementById("webview");
webview.addEventListener("dom-ready", function () {
  webview.executeJavaScript(`
    var bundleURL = "https://gistcdn.githack.com/aynik/9160a02686e34b114ecfa7bdcbf2f559/raw/chat-bridge.js";
    var script = document.createElement('script');
    script.setAttribute('src', bundleURL);
    document.head.appendChild(script);
  `);
});
