# Cross-Platform System Dashboard

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

This dashboard is especially useful if placed on a secondary screen, such as another monitor, or a connected iPad running the [Duet](http://www.duetdisplay.com) app.

![](docs/duet.png)

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

## Maintainer

https://github.com/JosephSpace

## Credits

https://github.com/JosephSpace/System-Board 

## License

MIT

The included Freeboard code is redistributed per its MIT License.
