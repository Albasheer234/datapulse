import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processImageBatch, processSingleImage } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processImageBatch, processSingleImage],
});
