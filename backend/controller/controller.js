import express from "express";

const app = express();
const router = express.Router();

router.post("/chunks/register", register);
router.get("/chunks/:fileHash/chunks", hash);
