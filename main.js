require("dotenv").config();

const express = require("express");
const app = express();

const PORT = process.env.PORT || 4000;

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Optionally, restart the process or log the error for further analysis
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
  // Optionally, restart the process or log the error for further analysis
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Render puppeteer server is up and running!");
});

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

const bot = new TelegramBot(token, { polling: false });

function sendNotification(message) {
  bot
    .sendMessage(channelId, message)
    .then(() => {
      console.log("Message sent successfully");
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
}

const puppeteer = require("puppeteer");

(async () => {
  let previousData = null;
  function delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
  browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--no-zygote"],
    headless: true,
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  await delay(1000);
  page = await browser.newPage();

  await delay(1000);

  page.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);

  await page.goto("https://tishreen.edu.sy/ar/Schedual/Results");

  await delay(1000);
  while (true) {
    try {
      await page.reloud();
      await delay(1000);
      console.log(process.memoryUsage());
      await page.select("[name=facultyId]", "51");
      await page.select("[name=studyYearId]", "11");
      await page.select("[name=semesterId]", "2");

      await delay(1000);

      await page.select("[name=departmentId]", "129");

      await page.evaluate(() => document.querySelector("#GetResults").click());

      await delay(1000);

      const data = await page.evaluate(() => {
        const results = document.querySelectorAll(".title-medium-dark.size-sm");
        return Array.from(results).map((v) => v.innerHTML);
      });

      if (previousData === null) {
        previousData = data;
        console.log("Initial data:", previousData);
      } else {
        const newData = data.filter((item) => !previousData.includes(item));

        if (newData.length > 0) {
          console.log("New data found:", newData);
          sendNotification(newData.toString().replace(/,/g, "\n"));
          previousData = [...data];
        } else {
          console.log("No new data found.");
          //sendNotification(previousData.toString().replace(/,/g, "\n"));
        }
      }

      await browser.close();
    } catch (error) {
      console.error("Error occurred, retrying...", error);
      if (browser) {
        await browser.close();
      }
      // Retry after a short delay
      await delay(5000);
      continue;
    }

    // Delay before the next loop iteration
    await delay(2000);
  }
})();
