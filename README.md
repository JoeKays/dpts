# dpts
Typescript version of dpt-rp1-py by janten

This project is a typescript version of https://github.com/janten/dpt-rp1-py.

You can use this to access the API of the Digital Paper Tablet from a web interface in your browser.

# Features
- Upload documents to the DPT
- Download documents from the DPT
- List the directory tree
- Create new folders
- Delete documents and folders
- supports WiFi connection (on Linux also supports USB connection)

# FAQ
1. How is this different from dpt-rp1-py?
    - dpts has a web interface (GUI).
    - You can use this from any device with a web browser.
2. Can I transfer documents on the DPT locally?
    - Yes you can! Just open the web interface in a browser on your DPT.
3. Is converting the private key to pkcs8 format required?
    - Not anymore. Manually converting the private key to pkcs8 format is - thanks to Niklas Werner - only required in the initial release (v0.9.0).
4. Do I really need to install a third party app to act as a web server?
    - No. This was a mistake on my side. It is not required to install any web server for any version of dpts (but you can of course do so if you like).
5. Can I use the USB cable with dtps without having WiFi connected?
    - Yes. But so far only on Linux. Please help to make it work on other platforms.
6. Will dpts respect my privacy? Will the private key that I select on the page be uploaded and sold for shady purposes?
    - Of course not. No private information will be sent by dpts to anywhere but the DPT API endpoint (as long as you configured it properly).

# Requirements
For dpts to work in your browser you need:
-  A recent Firefox or chromium-based browser (e.g. Chrom(e/ium) or Opera). Others are untested.
- adb root access if you want to use this locally on the DPT (see number 3 under section Problems for more info).
- Your device ID and private key for the DPT (see the dpt-rp1-py [wiki](https://github.com/janten/dpt-rp1-py#finding-the-private-key-and-client-id-on-windows) for infos on how to obtain those).
- (optional, you do *not* need this) a web server on your device (ServDroid from f-droid is known to work on Android, IWS does NOT work locally).

# Setup
To setup dpts on your device there are several steps required:

*Note:* When referring to 'your device' this can be any device. The DPT, your phone, or your computer all work fine.

1. Obtain your device ID and private key (see requirements).
2. (not required anymore, **you can skip this**, continue with step 3) Convert your private key to pkcs8 format by issueing the following commands (on Linux). On Windows try using WSL, Mac is not tested.
    ```
    $ openssl pkcs8 -topk8 -inform pem -in privatekey.dat -outform pem -nocrypt -out privatekey-pkcs8.pem
    ```
3. Download the most current dpts release from this page.
4. To setup dpts with your client ID and private key you have two options:
    - Edit dpt.html and paste your client ID and private key (with the --- BEGIN/END ... --- guards) into the respective *section*s.
    - Copy the two files onto your device (the device from which you want to transfer files by using the web interface) and when starting dpts select them in your browser (you only have to do this once, dpts saves the client ID and private key in local storage).
5. (optional, **danger**) Select the URL to the DPT API in dpt.html. In most/all cases you should **NOT** change this from the default value.
6. Copy the files *dpt.html, dpt.js, dpt.css* to your device (put them wherever you like, but keep in mind that you have to enter the path to these files in your web browser's address bar, so choose something short).
7. Access the web interface in your browser by typing the path to the html file (something like 'file:///sdcard/dtp.html' on the DPT) into your browsers' address bar.
8. (optional) In the dpts web interface select your device ID and private key if you haven't added them to the dpt.html file already (as explained in step 4).
9. Follow steps 3 and 4 under the following section *Problems* to make it work.

## Problems
If the page loads but there is an error (don't worry) it could be either:

1. Your browser is not compatible (see requirements).

2. The device from which you access the dpts web interface does not have network access to the DPT (there can be numerous reasons for this).

3. (**this one is very likely**) The default DPT API domain  'digitalpaper.local' can not be resolved from your device (Try to open https://digitalpaper.local:8443 in your browser to check this. If it works, accept the certificate).

    If your device indeed can not resolve this domain (some error should appear) you should add a DNS entry for digitalpaper.local on your device: On the DPT you can simply add the following to /system/etc/hosts (*no need to reboot or anything*):
    ```
    127.0.0.1   digitalpaper.local
    ::1         digitalpaper.local
    ```

    *Note:* (Linux only) If you are using the dpt-forward python script (see **TODO**) you can use the same entry on your Linux machine.

    On other devices you will have to find out the DPT's IP address and use that one instead.

4. (**also very likely**) either you have a certificate issue: The certificate from the DPT API is not trusted by your browser (because of a bad issuing authority),

    or (additionally) your browser (Firefox) does not allow dpts to send cross-origin requests (see https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy if you are interested in the reasons for this behaviour).

    You can easily solve both of these problems by opening https://digitalpaper.local:8443 in your browser and accepting the certificate (do not forget the http**s**://). There is now a link on the top left of the dpts web interface that you can just click. However you probably have to do this every time you restart your browser.

    In theory it should also be possible to setup a global exception for the DPT API's certificate in your system. For this you would have to visit https://digitalpaper.local:8443 in your browser (preferably from your desktop) and download the certificate. Then you could theoretically add this certificate to the system's trusted certificates. However I've had no luck trying this on the DPT. Maybe the browsers do not respect the system certificate settings on Android.


# Building
Note: If you just want to use dpts you do **not** have to build it from source yourself. Try the current release which includes an already compiled version.

To install dependencies yarn is recommended, but if you want you can also use npm.

## Build steps
```
yarn install
yarn build
```

# USB support (Linux only so far)
With the help of the dpt-forward python script you can use dpts over a USB connection.

The script does the following things:
1. Set the DPT USB interface to ethernet mode.
2. Assign an IP address to the interface and create a route to the DPT.
3. Forward all network traffic to the DPT's IPv6 address*.

\* This is necessary, because the DPT API does only accept requests to a certain IP address on the USB-interface. I am not sure why this is the case and I have not found another solution, yet.

## How-To Use

*Important Note:* The script uses commands that need *sudo* and therefore root access on your machine (the assigning of IP address and route requires that). 
However do **NOT** run the script itself as root. This is *not* necessary.

*Note:* Also, you need the program *socat* on your system in order to be able to forward network traffic to the DPT. You should be able to install it through your distro's package manager.

The script supports the following main arguments (use --help to find out more):
```
--usb [TTY] # this option switches the USB mode of the tty to ethernet (the default device is /dev/ttyACM0)

--forward IP # this option forwards all traffic to the specified IP address
```

So using the script usually would look something like this:
```
$ dpt-forward.py --usb --forward IPv6_ADDRESS
```
For the first use, however, you want to first find out the DPT's IPv6 address.

You can do this by issuing the following commands on your machine:
```
$ dpt-forward.py --usb
# wait till the command succeeded
$ adb shell ip a
```
The IPv6 address should be the link-local address assigned to the USB ethernet interface called **rndis0** and should look something like this: **fe80::1234:5678:1122:3344**

Now you can issue the forwarding command like this (replace the IP address with yours):
```
$ dpt-forward.py --forward fe80::1234:5678:1122:3344
```

Done. Next time you already know the DPT's IPv6 address and you can just issue the single command from above with both arguments combined.

Now the script should be forwarding the network traffic of dpts to the DPT.
Stop forwarding by interrupting with Ctrl+C when you don't need it anymore.

## Warnings

If you see a warning or error like this, don't worry:
1. 'Warning: /dev/ttyACM0 does not exist. Either ethernet over USB was already activated or you used the wrong tty. Try ls /dev/tty* to find out the correct tty. If there is multiple make a guess.'

    It could be that you already ran the script with --usb option and the USB mode was already switched to ethernet. In this case you can just ignore the warning.

    It could also be that you specified a wrong tty. On most systems you should be able to go with the default tty (/dev/ttyACM0) and not specify anything. But if you have other USB devices with tty connected (like a programmable keyboard), you'll have to change this to e.g. ttyACM1. Use the command from the warning to find out which devices are available and make a guess.

2. 'Warning: Could not assign IP.' or 'Warning: Could not create route.'

    There can be multiple reasons for that. You might want to just retry in this case.

3. 'Forwarding failed. Exiting...'

    This means that the forwarding using the command *socat* failed. Check if you have the program installed and if there are no other programs already using the forwarding port (usually 8443). To do this try something like *netstat -tulpn*

# Known limitations
dpts does not implement all functions of dpt-rp1-py.

The following features are not available in dpts:

- mounting (impossible to implement)
- WiFi functions
- registering
- templates
- firmware updating
- automatic network lookup

The following (and possibly more) functions are not (yet) implemented in the library part of dpts:

- screenshot
- document-info
- upload-template
- list-templates
- wifi (all)
- register
- update-firmware
- sync
- ping

The following limitations and shortcomings exist, but you are very welcome to come up with solutions and suggest them here:
- You have to accept the DPT API's security certificate in your browser every time you start it. See Problem 4 above.
- The USB forwarding script does so far only work on Linux. Please try to make it work on Windows and Mac if you have a system to test and some experience with python and networking on Windows/Mac and make a pull request!
- When loading the directory tree ALL contents of the storage are fetched from the DPT API which can take a lot of time if you have many files and folders. In the future this shall be done more efficiently (e.g. by only fetching the contents of the current folder).

# Contributing
Feel free to make pull requests or open issues if you find a bug or want to request a feature!

If you have a Mac or Windows system please help making the dpt-forward python script work on these platforms!

# Thanks
- Thanks to HappyZ for opening the DPT for everyone! Also thanks for telling me how to reset my DPT when I ran into a nasty problem with the encryption and got locked out of my device. 

    *Note:* When setting up a lock pattern, make sure to not make it required on boot, because otherwise you have to enter this pattern in the DPT startup screen password box in a weird fashion. I didn't know that and had to factory reset to make it work again (see https://github.com/HappyZ/dpt-tools/issues/170).
- Thanks to janten for writing the python API this project is based on.
- Thanks to Niklas Werner (@nw55) for helping me with this project, especially for the key format conversion algorithm, and for the library *@nw55/common* used in this project.

# LICENSE
This project is licensed under the GNU Affero General Public License v3.0.
