![image](https://github.com/user-attachments/assets/33fc52eb-857c-4dfa-9a6d-c3716922f9e3)# System Dashboard

![Adsız tasarım](https://github.com/user-attachments/assets/41c028f1-0705-4a80-bf4d-187f07c8aa1b)

This application provides visibility into all files and active device data on your system. It also allows you to access files available across your network. Furthermore, you can manage users attempting to log into the server. All data on the device can be viewed on both Windows and Linux systems.

All packages operate by importing Flask, allowing you to monitor the following data on your device:

* CPU %
* RAM %
* Disk Read/Write
* Nmap Table
* RAM Used/Total
* Disk Used/Total
* User Control

## Setup

`pip install flask` installs the Flask framework, allowing you to develop web applications and APIs in Python.

```
pip install flask
```
When this file is executed, it initializes a dedicated database for the user within the database file.

```
python python/database.py
```
When you run the `server.py` file, it opens a page for you. When you **Ctrl + Left Click** on the page, it redirects you to the login page.

```
python python/server.py
```

After the server starts, open any browser window and type the following URL: `http://127.0.0.1:5000/html/login.html`. You will then be redirected to the homepage.

## Project Structure

### Project Directory Structure

```
data/                  # Directory containing data files
├── users.json         # JSON file containing user information

python/                # Directory containing Python files
├── database.py        # Functions for database operations
├── users.py           # Functions related to user management
├── server.py          # Server settings for the Flask application
└── ssh_handler.py     # Functions to execute SSH commands

static/                # Directory containing static files
├── css/               # CSS files
│   ├── navbar.css     # Styles for the navigation bar
│   ├── style.css      # General style settings
│   └── users.css      # Styles for the user management page
├── html/              # HTML files
│   ├── app.html       # Main application page
│   ├── login.html     # Login page
│   └── remote.html    # Remote system connection page
└── js/                # JavaScript files
    ├── login.js       # JavaScript for login operations
    ├── navbar.js      # JavaScript for the navigation bar
    ├── remote.js      # JavaScript related to remote systems
    ├── system.js      # JavaScript to update system metrics
    ├── users.js       # JavaScript for user management
    └── ssh.js         # JavaScript for SSH terminal
``` 

## Maintainer

https://github.com/JosephSpace

## Credits

https://github.com/JosephSpace/System-Board 

## Contact

- İnstagram: https://www.instagram.com/f3rrkan/
- LinkedIn: https://www.linkedin.com/in/yusuf-aşkın-56015b232/
- Mail: yusufaliaskin@gmail.com

---
## License

MIT

The included Freeboard code is redistributed per its MIT License.
