const webview = document.getElementById("webview");
webview.addEventListener("dom-ready", function () {
  webview.executeJavaScript(`
    var bundleURL = "http://localhost:5678/chat-bridge.js";
    var script = document.createElement('script');
    script.setAttribute('src', bundleURL);
    document.head.appendChild(script);
  `);
});
