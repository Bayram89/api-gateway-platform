import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
createApp().listen(port, () => console.log(JSON.stringify({ level: "info", service: "pets-service", message: `listening on ${port}` })));

