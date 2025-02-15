const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dbfscshpn",
  api_key: "531291299822335",
  api_secret: "HNJeUjz9la93ohUJ11xAmyTJIdU",
});

module.exports = cloudinary;
