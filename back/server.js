const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const validUrl = require("valid-url");

(async () => {
  const { nanoid } = await import("nanoid");

  const app = express();

  app.use(cors()); // Allow all origins (adjust for production)
  app.use(express.json()); // Parse JSON request bodies

  mongoose.connect("mongodb://localhost:27017/shortlink", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const shortLinkSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true },
  });

  const ShortLink = mongoose.model("ShortLink", shortLinkSchema);

  app.post("/api/shorten", async (req, res) => {
    const { originalUrl, customShortUrl } = req.body;
  
    // Validate the original URL
    if (!validUrl.isUri(originalUrl)) {
      return res.status(400).json({ error: "Invalid URL format." });
    }
  
    // If a custom short URL is provided, check if it exists
    let shortUrl = customShortUrl || nanoid(6);
  
    try {
      // Check if the custom short URL already exists in the database
      const existingLink = await ShortLink.findOne({ shortUrl });
      if (existingLink) {
        return res.status(400).json({ error: "Custom short URL already taken." });
      }
  
      // Create and save the new short link
      const newShortLink = new ShortLink({ originalUrl, shortUrl });
      await newShortLink.save();
  
      // Respond with the original URL and the generated short URL
      res.json({ originalUrl, shortUrl });
    } catch (error) {
      console.error("Error creating short link:", error);
      res.status(500).json({ error: "Failed to create short link." });
    }
  });
  

  // API Endpoint to fetch all shortlinks
  app.get("/api/shortlinks", async (req, res) => {
    try {
      const shortlinks = await ShortLink.find();
      res.json({ shortlinks });
    } catch (error) {
      console.error("Error fetching shortlinks:", error); // Log the error for debugging
      res.status(500).json({ error: "Failed to fetch shortlinks." });
    }
  });

  // Redirect to the original URL
  app.get("/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;

    try {
      const link = await ShortLink.findOne({ shortUrl });
      if (!link) {
        return res.status(404).json({ error: "Short link not found." });
      }
      res.redirect(link.originalUrl);
    } catch (error) {
      console.error("Error retrieving short link:", error); // Log the error for debugging
      res.status(500).json({ error: "Failed to retrieve short link." });
    }
  });
// In the PUT /api/edit/:shortUrl endpoint

app.put("/api/edit/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params; // shortUrl from the URL params
  const { originalUrl, newShortUrl } = req.body; // New data for the link

  try {
    // Find the short link by the old shortUrl
    const link = await ShortLink.findOne({ shortUrl });

    if (!link) {
      return res.status(404).json({ error: "Short link not found." });
    }

    // If newShortUrl is provided, check if it's already taken
    if (newShortUrl && newShortUrl !== shortUrl) {
      const existingLink = await ShortLink.findOne({ shortUrl: newShortUrl });
      if (existingLink) {
        return res
          .status(400)
          .json({ error: "This short URL is already taken." });
      }
      link.shortUrl = newShortUrl; // Update the shortUrl if it's unique
    }

    // Update the original URL
    if (originalUrl) {
      link.originalUrl = originalUrl;
    }

    // Save the updated link
    await link.save();

    res.json({
      message: "Short link updated successfully",
      link,
    });
  } catch (error) {
    console.error("Error updating short link:", error);
    res.status(500).json({ error: "Failed to update short link." });
  }
});

  

  // Delete shortlink by shortUrl
  app.delete("/api/delete/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;

    try {
      const link = await ShortLink.findOneAndDelete({ shortUrl });
      if (!link) {
        return res.status(404).json({ error: "Short link not found." });
      }

      res.json({
        message: "Short link deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting short link:", error);
      res.status(500).json({ error: "Failed to delete short link." });
    }
  });

  app.listen(5000, () => {
    console.log("Server is running on http://localhost:5000");
  });
})();
