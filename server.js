if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const bcrypt = require('bcrypt')
const path = require('path')
require('../Student Login/dataBase')
const users = require('../Student Login/models/user')
const studentData = require('../Student Login/models/studentEnroll')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const multer = require('multer')
const LocalStrategy = require('passport-local').Strategy
const app = express()
const user = []
const data = []

const Storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: Storage, limits: {
        fieldSize: 1024 * 1024 * 4
    }
})

app.set('view-engine', 'ejs')
app.use(express.static('./uploads'))
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

passport.use(new LocalStrategy({ usernameField: 'userName' },
    function (username, password, done) {
        users.findOne({ userName: username }, async function (err, user) {
            if (err) { return done(err) }
            if (!user) {
                return done(null, false, { message: 'Incorrect User Name or Password' })
            }
            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: 'Incorrect User Name or Password' })
                }
            } catch (e) {
                return done(e)
            }
        })
    }
))


passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser((id, done) => {
    users.findById(id, (err, user) => {
        if (err) {
            return done(null, false)
        }
        return done(null, user)
    })
})

app.post('/', upload.single('image'), async (req, res) => {
    data.push({
        name: req.body.name,
        identity: req.body.identity,
        className: req.body.className,
        dob: req.body.dob,
        branch: req.body.branch,
        image: req.file.filename
    })
    req.flash('user', 'Student enrolled successfully')
    res.redirect('/')
    await studentData.create(data)
})

app.get('/', (req, res) => {
    const message = req.flash('user')
    res.render('enrollment.ejs', {message: message})
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    const message = req.flash('user')
    res.render('login.ejs',{message:message})
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/data',
    failureRedirect: '/login',
    failureFlash: true
})
)

app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        user.push({
            id: Date.now().toString(),
            name: req.body.name,
            userName: req.body.userName,
            email: req.body.email,
            password: hashedPassword
        })
        req.flash('user', 'Admin Registered')
        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
    await users.create(user)
})

app.get('/data', checkAuthenticated, async (req, res) => {
    const all_data = await studentData.find()
    res.render('data.ejs',{records: all_data})
    // res.render('data.ejs')
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/data')
    }
    next()
}

app.listen(5000)