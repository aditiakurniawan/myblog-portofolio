const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "uploads"); //penyimpanan
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + "-" + file.originalname); //rename
  },
});

const upload = multer({ storage });
module.exports = upload;
