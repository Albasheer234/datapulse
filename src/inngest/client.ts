import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "datapulse-saas",
  // Vercel serverless optimization
  eventKey: process.env.INNGEST_EVENT_KEY,
});
