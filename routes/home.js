///////////////////////////////
// Import Router
////////////////////////////////
const router = require("express").Router()
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const Image = require("../models/User")

///////////////////////////////
// Custom Middleware Functions
////////////////////////////////

// authorization: check if user is logged in, add req.user
const addUserToRequest = async (req, res, next) => {
    // check if the user is logged in
    if (req.session.userId) {
        req.user = await User.findById(req.session.userId)
        next()
    } else {
        next()
    }
}

// authorization: check if req.user exists; if not, redirect to login
const isAuthorized = (req, res, next) => {
    if (req.user) {
        next()
    } else {
        res.redirect("/auth/login")
    }
}

///////////////////////////////
// Router Specific Middleware
////////////////////////////////
router.use(addUserToRequest)


///////////////////////////////
// Router Routes
////////////////////////////////
router.get("/", (req, res) => {
    res.render("home")
})
// AUTH RELATED ROUTES
// SIGNUP ROUTE
router.get("/auth/signup", (req, res) => {
    res.render("auth/signup")
} )
router.post("/auth/signup", async (req, res) => {
    try {
        // generate our salt
        const salt = await bcrypt.genSalt(10)
        console.log(req.body)
        // hash the password
        req.body.password = await bcrypt.hash(req.body.password, salt)
        console.log(req.body)
        // create the new user
        await User.create(req.body)
        // res.redirect
        res.redirect("/auth/login")
    } catch(error){
        res.json(error)
    }
})


//Login Routes
router.get("/auth/login", (req, res) => {
    res.render("auth/login")
})
router.post("/auth/login", async (req, res) => {
    try {
        // get the user
        const user = await User.findOne({username: req.body.username})
        if (user) {
            // check if the passwords match
            const result = await bcrypt.compare(req.body.password, user.password)
            if (result) {
                // add userID propoerty to the session object
                req.session.userId = user._id
                // redirect
                res.redirect("/images")
            } else {
                res.json({error: "Password Does Not Match"})
            }
        } else {
            res.json({error: "User Doesn't Exist"})
        }
    } catch(error) {
        res.json(error)
    }
})

//logout
router.get("/auth/logout", (req, res) => {
    // remove the userId property
    req.session.userId = null
    // redirect to main page
    res.redirect("/")
})

// Images Index Route render view
router.get("/images", isAuthorized, async (req, res) => {
    // pass req.user to our template
    res.render("images", {
        images: req.user.images
    })
})

// DELETE
router.delete("/images/:id", isAuthorized, async (req, res) => {
    const user = await User.findOne({username: req.user.username})
    user.images.slice(req.body)
    // await user.save()
    // Image.findByIdAndRemove(req.params.id, (error, data) => {
        res.redirect("/images");
})

// Update Page route render view
router.get("/new", isAuthorized, async (req, res) => {
    res.render("new", {
        images: req.user.images
    })
})

// Images create route when form submitted
router.post("/images", isAuthorized, async (req, res) => {
    // fetch up-to-date user
    const user = await User.findOne({username: req.user.username})
    // push new image and save
    user.images.push(req.body)
    await user.save()
    // redirect back to images index
    res.redirect("/images")
})


///////////////////////////////
// Export Router
////////////////////////////////
module.exports = router