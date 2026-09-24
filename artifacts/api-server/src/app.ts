import express, { type ErrorRequestHandler, type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger, serializeError } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use("/api/webhooks/whop", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  logger.error(
    {
      error: serializeError(error),
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
    },
    "Unhandled API error",
  );

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({ error: "Internal Server Error" });
};

app.use(errorHandler);

export default app;
