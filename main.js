require("dotenv").config();
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

  while (true) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    function delay(time) {
      return new Promise(function (resolve) {
        setTimeout(resolve, time);
      });
    }

    page.setDefaultNavigationTimeout(90000);
    page.setDefaultTimeout(90000);

    await page.goto("https://tishreen.edu.sy/ar/Schedual/Results");

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

    await browser.close();

    if (previousData === null) {
      previousData = data;
      console.log("Initial data:", previousData);
    } else {
      const newData = data.filter((item) => !previousData.includes(item));

      if (newData.length > 0) {
        console.log("New data found:", newData);
        sendNotification(newData.toString());
        previousData = [...data];
      } else {
        console.log("No new data found.");
        sendNotification(previousData.toString().replace(/,/g, "\n"));
      }
    }

    await delay(2000);
  }
})();
