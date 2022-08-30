require('dotenv').config();
const { DataModel } = require('./database/dataBase');
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { engine }  = require('express-handlebars');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

// TODO: Create app and add middlewares
var app = express();
app.use(express.json());
app.use(cookieParser());
app.use(Authenticate);
app.use(express.static(__dirname+"/pages"));
app.use(bodyParser.urlencoded({ extended: false }));

//TODO: Add view engine
app.engine('.hbs', engine({
    extname: '.hbs',
    helpers: {
        isError:(value) => {
            return value == "Error";
        },
        isWarning:(value) => {
            return value == "Warning";
        },
        isOk:(value) => {
            return value == "Ok";
        }
    }
}));
app.set('view engine', '.hbs');
app.set('views', __dirname+"/pages");

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// TODO: Prevent Cross-site Scripting
const escapeHTML = str => str.replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));

app.get('/',(req,res)=>{
    if(req.user)
        res.render("homepage",{
            layout: false,
            name: escapeHTML(req.user.name)
        });
    else res.render("login",{
        layout: false,
        message: {
            type: "Warning",
            message: "You need to login to continue"
        }
    });
})

app.get('/login',(req,res) => {
    res.render("login",{
        layout: false,
        message: {
            type: null,
        }
    });
})

app.get('/signup',(req,res) => {
    res.render("signup",{
        layout: false,
        message: {
            type: null
        }
    });
})

app.post('/signup',async (req,res) => {
    let user = {
        name : req.body.name,
        age : req.body.age,
        sex : req.body.sex,
        password : await bcrypt.hash(req.body.password,12)
    };

    DataModel.create(user)
    .then(()=>{
        res.render("signup",{
            layout: false,
            message: {
                type: "Ok",
                message: "Account created successfully"
            }
        });
    })
    .catch(err => {
        if(err.name == "SequelizeUniqueConstraintError") 
            res.render("signup",{
                layout: false,
                message: {
                    type: "Warning",
                    message: "Username already taken"
                }
            });
        else{
            console.error(err);
            res.sendStatus(500);
        }
    });
})

app.post('/login',(req,res) => {
    // TODO: Check is the User is Present
    DataModel.findOne({
        where : {
            name : req.body.username,
        },
        attributes : ['password']
    }).then(user=>{
        //If user if present, check the password
        if(user){
            bcrypt.compare(req.body.password,user.dataValues.password,(err,result)=>{
                if(err){
                    console.log(err);
                    res.sendStatus(500);
                }
                else{
                    if(result){
                        DataModel.findOne({
                            where : {
                                name : req.body.username,
                            },
                            attributes : ['name', 'age','sex']
                        }).then(user => {
                            let accessToken = jwt.sign(user.dataValues, process.env.ACCESS_TOKEN_SECRET);
                            res.cookie("jwt",accessToken,{
                                httpOnly: true
                            });
                            res.redirect('/');
                        }).catch(err=>{
                            console.error(err);
                            res.sendStatus(500);
                        })
                    }else res.render("login",{
                        layout: false,
                        message: {
                            type: "Error",
                            message: "Invalid Credentials"
                        }
                    });
                }
            })
        }else res.render("login",{
            layout: false,
            message: {
                type: "Warning",
                message: "User not Found"
            }
        });
    })
})

DataModel.sequelize.sync()
.then(server.listen(PORT,console.log("Server running on PORT",PORT)))
.catch(err => console.error(err))

function Authenticate(req,res,next){
    let authHeader = req.cookies.jwt;
    if(authHeader && authHeader !== 'j:null'){
        jwt.verify(authHeader.trim(),process.env.ACCESS_TOKEN_SECRET,(err,user)=>{
            if(err) return res.sendStatus(403);
            req.user = user; next();
        })
    }else{
        req.user = null;
        next();
    }
}

app.get('/logout',(req,res) => {
    if(req.user) res.cookie("jwt",null,{
        httpOnly: true
    });
    res.redirect('/');
})