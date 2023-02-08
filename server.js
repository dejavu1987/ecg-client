const { Server } = require("ws");

const sockserver = new Server({ port: 3211 });

sockserver.on("connection", (ws) => {
  console.log("New client connected!");
  ws.on("close", () => console.log("Client has disconnected!"));
});

setInterval(() => {
  sockserver.clients.forEach((client) => {
    client.send(Math.round(random() * 4000));
  });
}, 8000);
