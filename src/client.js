import Comfey, { ComfeyDom } from "comfey";

const COMFEY_DEBUG = 0;

const viewUpdater = new ComfeyDom(document.getElementById("ecg"), COMFEY_DEBUG);
const ecgApp = new Comfey(viewUpdater);

const [_RR, setRR] = ecgApp.useState("rr", 0);
const [_freq, setFreq] = ecgApp.useState("freq", 0);
const [_hr, setHR] = ecgApp.useState("hr", 0);
const [_val, setVal] = ecgApp.useState("value", 0);

const pauseBtn = document.getElementById("pause-btn");

let t = -1;
const n = 300;
const analogResolution = 255;
const data = [];

const margin = {
  top: 6,
  right: 0,
  bottom: 40,
  left: 0,
};
const width = 600 - margin.right - margin.left;
const height = 360 - margin.top - margin.bottom;

const x = d3.scale
  .linear()
  .domain([t - n + 1, t])
  .range([0, width]);
const xAxis = d3.svg.axis().scale(x).orient("bottom");

const y = d3.scale.linear().range([height, 0]).domain([0, analogResolution]);
const yAxis = d3.svg.axis().scale(y).orient("left");

const line = d3.svg
  .line()
  .interpolate("basis")
  .x(function (d, i) {
    return x(d.time);
  })
  .y(function (d, i) {
    return y(d.value);
  });

const svg = d3
  .select(".ecg-graph")
  .append("p")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("margin-left", margin.left + "px")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg
  .append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

const $xAxis = svg
  .append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call((x.axis = xAxis));

const $yAxis = svg
  .append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(60,0)")
  .call((y.axis = yAxis));

const path = svg
  .append("g")
  .attr("clip-path", "url(#clip)")
  .append("path")
  .style("fill", "none")
  .style("stroke", "black")
  .style("stroke-width", "1")
  .data([data])
  .attr("class", "line");

function tick() {
  x.domain([t - n + 2, t]);
  $xAxis.call(x.axis);

  // redraw the line
  svg.select(".line").attr("d", line);

  if (data.length > n) data.shift();
}

if ("WebSocket" in window) {
  const ws = new WebSocket("ws://esp-ecg.local/ws");
  // Mock server
  // var ws = new WebSocket("ws://localhost:3211");
  ws.onerror = (e) => {
    console.error({ e });
  };
  ws.onopen = function () {
    pauseBtn.addEventListener("click", (e) => {
      ws.send("p");
    });
  };
  let millis = 0;
  let millisBuf = [];
  let lastR = +new Date();
  ws.onmessage = function (evt) {
    const val = evt.data;
    val
      .trim()
      .split(" ")
      .forEach((v) => {
        const newMillis = performance.now();
        const value = parseInt(v);

        // Calculate the data rate
        if (millisBuf.length <= 100) {
          millisBuf.push(newMillis - millis);
        }
        if (millisBuf.length === 100) {
          const avgMillis = millisBuf.reduce((p, c) => p + c, 0) / 100;
          setFreq(Math.round(1000 / avgMillis));

          millisBuf = [];
        }
        millis = newMillis;

        // Calculate heart rate
        if (value > analogResolution * 0.6) {
          const now = +new Date();
          const rr = now - lastR;
          if (rr > 200) {
            lastR = now;
            setRR(rr);
            setHR(Math.round((1000 / rr) * 60));
          }
        }

        // update Graph
        data.push({
          time: ++t,
          value,
        });
        // document.getElementById("data").append(`, ${value}`);

        // Just to visualize heart beating
        if (millisBuf.length % 5) setVal(value / 80 + 15);
        tick();
      });
  };

  ws.onclose = function () {
    console.warn("Connection is closed...");
    setTimeout(() => {
      window.location = ".";
    }, 2000);
  };
} else {
  console.error("WebSocket NOT supported by your Browser!");
}

document.getElementById("new").addEventListener("click", (e) => {
  const newData = document.createElement("textarea");
  document.getElementById("datag").append(newData);
  document.getElementById("data").setAttribute("id", +new Date());
  newData.setAttribute("id", "data");
});
