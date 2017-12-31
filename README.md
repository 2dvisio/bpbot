# bpbot
Telegram bot to store Blood pressure data. It provides historical data and graphs to the end user.

# How to use
0. Clone the code into your server (publicly accessible)
1. Obtain TOKEN from Telegram's Botfather and add it to the `env_template.json`
2. Obtain Username and Token from plotly and add them to the `env_template.json`
3. Rename `env_template.json` as `env.json`
4. Run `npm install`
5. Run your server with `nodejs telegramBPserver.js`

# What this project is
This project is just a proof of concept, and it is not intended for use in real healthcare settings.
Data are not encrypted on the Mongo database. Whenever you deal with data from real patients (even if consenting to participate) it is mandatory to encrypt data (or encrypt the database).
This project is intended as 'stepping stone' for whoever wants to start to _see_ something printed by their Telegram bot and want to customise it more.


# Additional development ideas
- Configuration options (e.g. contact at specific time of the day, specific days of the week)
- Storage of consent
- Privacy policy
- Encouragement messages
