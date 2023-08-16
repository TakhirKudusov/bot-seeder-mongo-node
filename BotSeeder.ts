import mongoose, { Schema } from "mongoose";
import * as fs from "fs";
import { faker } from "@faker-js/faker";
import { IBot } from "./IBot.interface";
import dotenv from "dotenv";
import vault from "node-vault";

dotenv.config();

class BotSeeder {
  private readonly vaultOpts: vault.VaultOptions = {
    token: process.env.VAULT_TOKEN,
  };

  private readonly vault = vault(this.vaultOpts);

  private readonly BotModel = mongoose.model(
    "Bot",
    new Schema<IBot>({
      login: { type: String, required: true },
      image: {
        type: String,
        default: "",
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    }),
  );

  private database: string;

  public constructor() {
    console.log("[bot-seeder]: initialization...");

    this.vault
      .read("kv/bot-seeder")
      .then(({ data }) => (this.database = data.database))
      .then(() => this.mongooseConnect())
      .then(() => this.checkBots())
      .then(() => this.generateBots())
      .catch(console.error);
  }

  private checkBots = async () => {
    console.log("[bot-seeder]: checking for bots...");
    const botsQty = (await this.BotModel.find({})).length;
    if (botsQty > 0) {
      console.log("[bot-seeder]: bots are already existing");
      process.exit(0);
    }
  };

  private mongooseConnect = async () => {
    try {
      console.log("[bot-seeder]: connecting mongoose...");
      await mongoose.connect(this.database);
      console.log("[bot-seeder]: mongoose connected");
    } catch (error) {
      console.error("[bot-seeder]:", error);
    }
  };

  private generateBots = () => {
    console.log("[bot-seeder]: generating bots...");
    for (let i = 0; i < 10_000; i++) {
      const bot = new this.BotModel({
        login: faker.internet.userName(),
      });

      fs.readdir("./public/images", (err, files) => {
        if (err) {
          console.error(err);
        } else {
          const random = Math.floor(Math.random() * files.length);
          bot.image = "/images/" + files[random];
          bot
            .save()
            .then((bot) => {
              console.log(`[bot-seeder]: generated bot with id: ${bot._id}`);
              if (i === 9_999) {
                console.log(
                  "[bot-seeder]: bots successfully generated! Ending the work...",
                );
                process.exit(0);
              }
            })
            .catch((err) => console.error(err));
        }
      });
    }
  };
}

new BotSeeder();
