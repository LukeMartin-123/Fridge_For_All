const router = require("express").Router();
const User = require('../../models/userModel');
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

//Register
router.post("/", async (req, res) => {
    try {
        const { email, password, passwordVerify } = req.body

        //Validation

        if (!email || !password || !passwordVerify)
            return res.status(400).json({ errorMessage: "Please enter all required fields." })

        if (password !== passwordVerify)
            return res.status(400).json({ errorMessage: "Please enter the same password twice" })

        const existingUser = await User.findOne({ email: email });
        if (existingUser)
            return res.status(400).json({
                errorMessage: "Account with this email already exists"
            })

        //Hashing password

        const salt = await bcrypt.genSalt()
        const passwordHash = await bcrypt.hash(password, salt)
        console.log(passwordHash)

        //save a new user
        const newUser = new User({
            email, passwordHash
        })
        const savedUser = await newUser.save();

        // sign the token
        const token = jwt.sign({
            user: savedUser._id
        }, process.env.JWT_SECRET
        );

        //send the token in a cookie
        res.cookie("token", token, {
            httpOnly: true,
        })
            .send();

    } catch (err) {
        console.error(err)
        res.status(500).send()
    }
});

//log in

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        //validate

        if (!email || !password)
            return res.status(400).json({ errorMessage: "Please enter all required fields." })

        const existingUser = await User.findOne({ email });
        if (!existingUser)
            return res
                .status(401).json({ errorMessage: "Wrong email or password" })

        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash)
        if (!passwordCorrect)
            return res
                .status(401).json({ errorMessage: "Wrong email or password" })

        // sign the token
        const token = jwt.sign({
            user: existingUser._id
        }, process.env.JWT_SECRET
        );

        //send the token in a cookie
        res.cookie("token", token, {
            httpOnly: true,
        })
            .send();

    }
    catch (err) {
        console.error(err)
        res.status(500).send()
    }
});

router.get("/logout", (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0)
    })
        .send();
})

router.get("/loggedIn", (req, res) => {
    try {
        const token = req.cookies.token;
        if(!token) return res.json(false);

        jwt.verify(token, process.env.JWT_SECRET);
        res.json(true)

    } catch (err) {
        res.json(false)
    }
});


module.exports = router;