const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // session expiry time (1 day)
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (!req.session.username && req.path !== '/login') {
        res.redirect('/login');
    } else {
        next();
    }
});

app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Login</title>
        </head>
        <body>
            <h1>Login Page</h1>
            <form id="loginForm" action="/login" method="post">
                <p>Enter Username : </p>
                <input type="text" id="username" name="username">
                <button type="submit">Login</button>
            </form>
        
            <script>
                // Add event listener to the form submission
                document.getElementById('loginForm').addEventListener('submit', function(event) {
                    // Prevent the default form submission behavior
                    event.preventDefault();
        
                    // Get the value of the username input field
                    var username = document.getElementById('username').value;
        
                    // Store the username in the local storage
                    localStorage.setItem('username', username);
        
                    // Submit the form
                    this.submit();
                });
            </script>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { username } = req.body;
    req.session.username = username;
    res.redirect('/message-input');
});

app.get('/message-input', (req, res) => {
    fs.readFile('messages.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading messages file:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        const messages = data.split('\n').filter(message => message.trim() !== '');
        const messagesHTML = messages.map(message => `<div>${message}</div>`).join('');
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Message Input</title>
            </head>
            <body>
                <h1>Message Input</h1>
                <div id="messages">
                    ${messagesHTML}
                </div>
                <form action="/message" method="post">
                    <input type="text" name="message" placeholder="Type your message...">
                    <button type="submit">Send</button>
                </form>
            </body>
            </html>
        `);
    });
});
app.post('/message', (req, res) => {
    const username = req.session.username;
    const message = req.body.message;

    const formattedMessage = `${username}: ${message}\n`;

    fs.appendFile('messages.txt', formattedMessage, (err) => {
        if (err) {
            console.error('Error appending message to file:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.redirect('/message-input');
    });
});

app.listen(3050, () => {
    console.log("Server is running on port 3050");
});
