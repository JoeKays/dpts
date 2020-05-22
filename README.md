# dpts
Typescript version of dpt-rp1-py by janten

This project is a typescript version of https://github.com/janten/dpt-rp1-py.

You can use this to access the API of the Digital Paper Tablet from a web interface in your browser.

# Features
- Upload documents to the DPT
- Download documents from the DPT
- List the directory tree
- Create new folders

# FAQ
1. How is this different from dpt-rp1-py?
    - dpts has a web interface (GUI).
    - You can use this from any device with a web browser.
2. Can I transfer documents on the DPT locally?
    - Yes you can! Just open the web interface from the DPT in a browser.
3. Is converting the private key to pkcs8 format required?
    - We are working on a way to overcome this limitation, but for now the answer is Yes.
4. Do I really need to install a third party app to act as a web server?
    - Yes. However you are very welcome to suggest a different option if you think that there is one.
5. Will dpts respect my privacy? Will the private key that I selec on the page be uploaded and sold for shady purposes?
    - Of course not. No private information will be sent by dpts to anywhere but the DPT API endpoint (as long as you configured it properly).

# Requirements
For dpts to work in your browser you need:
-  A *recent chromium-based browser* (e.g. Chrom(e/ium) or Opera). **Firefox does NOT (yet) work**, others are untested.
- adb root access (see nunber 3 under section Problems for more info).
- A way to host the webpage on your device (ServDroid from f-droid is known to work on Android, IWS does NOT work locally).
- Your device ID and private key for the DPT (see the dpt-rp1-py [wiki](https://github.com/janten/dpt-rp1-py#finding-the-private-key-and-client-id-on-windows) for infos on how to obtain those).
- openssl in order to convert your private key to pkcs8 format, as the default DPT key format is not supported by dpts.

# Setup
To setup dpts on your device there are several steps required:

1. Obtain your device ID and private key (see requirements).
2. Convert your private key to pkcs8 format by issueing the following commands (on Linux). On Windows try using WSL, Mac is not tested.
```
$ openssl pkcs8 -topk8 -inform pem -in privatekey.dat -outform pem -nocrypt -out privatekey-pkcs8.pem
```
3. Download the most current dpts release from this page.
4. To setup dpts with your client ID and private key you have two options:
    - Edit dpts.html and paste your client ID and private key (in pkcs8 format) into the respective *section*s.
    - Copy the two files onto the device from which you want to access the web interface and select them in your browser (you only have to do this once).
5. (optional) Select the URL to the DPT API in dpts.html. In most cases you should **NOT** change this from the default value.
6. Install a web server on your device (see requirements).
7. Copy the following files to the root directory that is hosted by the web server: *dpt.html, dpt.js, dpt.css*
8. Setup the web server to host these files (should work out of the box in ServDroid, you just have to run it, select a port, and enable hosting)
9. Access the web interface in your browser on the configured port (e.g. http://localhost:PORT).
10. (optional) Select your device ID and private key if you haven't added them to the dpt.html file already.
11. Follow steps 3 and 4 under the following section *Problems*.

## Problems
If the page loads but there is an error (don't worry) it could be either:

1\. Your browser is not compatible (see requirements).

2\. The device from which you access the dpts web interface does not have network access to the DPT (there can be numerous reasons for this).

3\. (**this one is very likely**) The default DPT API domain  'digitalpaper.local' can not be resolved from your device (Try to open https://digitalpaper.local:8443 in your browser to check this. If it works, accept the certificate).

If this is the case you should add a DNS entry for digitalpaper.local on your device: On the DPT you can simply add the following to /system/etc/hosts (*no need to reboot or anything*):
```
127.0.0.1   digitalpaper.local
::1         digitalpaper.local
```

4\. (**also very likely**) You have a certificate issue: The certificate from the DPT API is not trusted by your browser (because of a bad issuing authority).
You can easily solve this by opening https://digitalpaper.local:8443 in your browser and accepting the certificate (do not forget the http**s**://).


# Building
Note: If you just want to use dpts you do **not** have to build it from source yourself. Try the current release which includes an already compiled version.

To install dependencies yarn is recommended, but if you want you can also use npm.

## Build steps
```
yarn install
yarn build
```

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

The following limitations exist, but you are very welcome to come up with solutions and suggest them here:

- A third party application is required to work as a web server.
- The private key has to be converted to the pkcs8 format.
- When loading the directory tree ALL contents of the storage are fetched from the DPT API which can take a lot of time if you have many files and folders. In the future this shall be done more efficiently (e.g. by only fetching the contents of the current folder).

# Contributing
Feel free to make pull requests or open issues if you find a bug or want to request a feature!

# Thanks
- Thanks to HappyZ for opening the DPT for everyone!
- Thanks to janten for writing the python API this project is based.
- Thanks to Niklas Werner (nw55) for his help and for the library *@nw55/common* used in this project.

# LICENSE
This project is licensed under the GNU Affero General Public License v3.0.
