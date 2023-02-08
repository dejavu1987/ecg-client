const { Server } = require("ws");

const sockserver = new Server({ port: 3211 });

sockserver.on("connection", (ws) => {
  console.log("New client connected!");
  ws.on("close", () => console.log("Client has disconnected!"));
});

const getRandomInRange = (min, max) => {
  return Math.round(min + Math.random() * (max - min));
};
setInterval(() => {
  const msecDiv = +new Date() % 1000;

  sockserver.clients.forEach((client) => {
    // const data = `${Math.round(Math.random() * 4000)} ${Math.round(
    //   Math.random() * 4000
    // )} ${Math.round(Math.random() * 4000)} ${Math.round(
    //   Math.random() * 4000
    // )} ${Math.round(Math.random() * 4000)}`;
    let min = 0;
    let max = 4000;

    if (msecDiv < 450 || msecDiv > 550) {
      min = 1000;
      max = 1100;
    }
    if ((msecDiv < 250 && msecDiv > 100) || (msecDiv < 900 && msecDiv > 800)) {
      min = 1100;
      max = 1200;
    }
    if ((msecDiv < 450 && msecDiv > 380) || (msecDiv < 650 && msecDiv > 550)) {
      min = 900;
      max = 1000;
    }
    if (msecDiv >= 450 && msecDiv <= 550) {
      min = 1100;
      max = 2000;
    }
    if (msecDiv >= 490 && msecDiv <= 510) {
      min = 2000;
      max = 3000;
    }
    const data = getRandomInRange(min, max);
    client.send(data);
  });
}, 10);
