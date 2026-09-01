import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3002);
createApp().listen(port, () => console.log(JSON.stringify({ level: "info", service: "appointments-service", message: `listening on ${port}` })));

