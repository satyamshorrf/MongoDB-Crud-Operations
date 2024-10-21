const { AsyncLocalStorage } = require("async_hooks");
const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");


const app = express();
const PORT = 8080;

// Connection to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/youtube-app-1")
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('Mongo Error', err));

// User Schema
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    jobTitle: {
        type: String,
    },
    gender: {
        type: String,
    },
},
    { timeseries: true }
);

const User = mongoose.model("user", userSchema);

// Middleware
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
    fs.appendFile(
        "log.txt",
        `\n${Date.now()}:${req.ip} ${req.method}: ${req.path}\n`,
        (err) => {
            if (err) console.error("Log error: ", err);
            next();
        }
    );
});

// Routes
app.get("/users", async (req, res) => {
    const allDbUsers = await User.find({});
    const html = `
    <ul>
    ${allDbUsers.map((user) => `<li>${user.firstName} - ${user.email} </li>`).join('')}
    </ul>
    `;
    res.send(html);
});

// REST API
app.get("/api/users", async(req, res) => {
    const allDbUsers = await User.find({});
    return res.json(allDbUsers);
});

app
    .route("/api/users/:id")
    .get(async(req, res) => {
        const user = await User.findById(req.params.id);
        return res.json(user);
    })
    .patch(async(req, res) => {
      await User.findByIdAndUpdate(req.params.id, { lastName: "Changed"});
        return res.json({ status: "Success"});
    })
    .delete(async (req, res) => {
        await User.findByIdAndDelete(req.params.id);
        return res.json({ status: "Success" });
    });

app.post("/api/users", async (req, res) => {
    const body = req.body;
    if (
        !body ||
        !body.first_name ||
        !body.last_name ||
        !body.email ||
        !body.gender ||
        !body.job_title
    ) {
        return res.status(400).json({ msg: "All fields are required." });
    }

    const result = await User.create({
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        gender: body.gender,
        jobTitle: body.job_title,
    });

    
    return res.status(201).json({ msg: "User  created successfully", user: result });
});

app.listen(PORT, () =>
    console.log(`Server Started at Port: ${PORT}`)
);