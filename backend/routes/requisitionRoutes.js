const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const controller = require("../controllers/requisitionController");

router.post("/", authMiddleware, roleMiddleware("member"), controller.create);
router.get("/mine", authMiddleware, roleMiddleware("member"), controller.mine);
router.get("/", authMiddleware, roleMiddleware("admin", "librarian"), controller.all);
router.patch("/:id/status", authMiddleware, roleMiddleware("admin", "librarian"), controller.updateStatus);

module.exports = router;
