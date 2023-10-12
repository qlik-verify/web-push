function QlikVerify() {
}

const askPermission = () => {
    return new Promise((resolve, reject) => {
        const permissionResult = Notification.requestPermission((result) => {
            resolve(result)
        })
        if (permissionResult) {
            permissionResult.then(resolve, reject)
        }
    })
        .then((permissionResult) => {
            if (permissionResult !== 'granted') {
                throw new Error('Permission denied')
            }
        })
}

const appendTags = (url) => {
    const overlay = document.getElementById("qv-overlay");
    const popup = document.getElementById("qv-popup");
    overlay.remove();
    popup.remove();
    // Create a new <div> element
    var newDiv = document.createElement("div");

    // Set some attributes for the div (optional)
    newDiv.id = "qv-overlay";

    // Append the new <div> element to the <body> tag
    document.body.appendChild(newDiv);

    // Create a new <div> element
    var newDiv = document.createElement("div");

    // Set some attributes for the div (optional)
    newDiv.id = "qv-popup";
    newDiv.innerHTML = '<iframe src=' + url + ' id="qv-popup-iframe"></iframe>';

    // Append the new <div> element to the <body> tag
    document.body.appendChild(newDiv);

    overlay.style.display = "block";
    popup.style.display = "block";
    overlay.addEventListener("click", function () {
        overlay.style.display = "none";
        popup.style.display = "none";
    });

}


const showStatus = (message) => {
    if (!document.getElementById("qv-overlay")) {
        // Create a new <div> element
        var newDiv = document.createElement("div");

        // Set some attributes for the div (optional)
        newDiv.id = "qv-overlay";

        // Append the new <div> element to the <body> tag
        document.body.appendChild(newDiv);
    }

    if (!document.getElementById("qv-popup")) {
        // Create a new <div> element
        var newDiv = document.createElement("div");

        // Set some attributes for the div (optional)
        newDiv.id = "qv-popup";
        newDiv.innerHTML = '<p id="qv-popup-message">' + message + '</p>';

        // Append the new <div> element to the <body> tag
        document.body.appendChild(newDiv);
    }
    else {
        let iframe = document.getElementById("qv-popup-message");
        iframe.innerHTML = message;
    }

    const overlay = document.getElementById("qv-overlay");
    const popup = document.getElementById("qv-popup");
    overlay.style.display = "block";
    popup.style.display = "block";
    overlay.addEventListener("click", function () {
        overlay.style.display = "none";
        popup.style.display = "none";
    });

}

const register = async (data, opts, callback) => {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // Adjust the content type based on your API requirements
            // You may need to include additional headers depending on the API
            "ngrok-skip-browser-warning": "69420"
        },
        body: JSON.stringify(data) // Convert the data to JSON format
    };
    try {
        // Make the fetch request and wait for the response
        const response = await fetch(opts.api, requestOptions);

        // Check if the request was successful (status code 2xx)
        if (!response.ok) {
            if (opts.showStatus) {
                showStatus(`Register Failed: ${response.status}`);
            }
            callback({ type: "register", "success": false, "reason": `Register Failed: ${response.status}` });
        }
        else {
            if (opts.showStatus) {
                showStatus(`Loading...Please wait`);
            }
            callback({ type: "register", "success": true })
        }

    } catch (error) {
        if (opts.showStatus) {
            showStatus(`Error: ${error}`);
        }
        callback({ type: "register", "success": false, "reason": `Error: ${error}` });
    }
}

const listen = (callback) => {
    navigator.serviceWorker.onmessage = (event) => {
        const payload = JSON.parse(event.data.payload);
        switch (payload.type) {
            case "trx_init":
                appendTags(payload.url);
                break;
            case "trx_result":
                callback({ type: "result", "data": payload.result });
                break;
        }
    };
}

QlikVerify.prototype.register = function (metadata, cnfg, callback) {
    if (cnfg.key === undefined) {
        throw Error('QlikVerify key is requried. Check with admin to receive one for the application');
    }

    if (WORKERJS === undefined) {
        throw Error('QlikVerify WORKERJS file is requried. Check with admin to receive one for the application');
    }

    const opts = {
        userVisibleOnly: true,
        applicationServerKey: cnfg.key
    }
    navigator.serviceWorker.register('https://push-api-eg.netlify.app/qv-worker.js')
        .then((registration) => {
            askPermission().then(() => {
                return registration.pushManager.subscribe(opts)
            }).then((pushSubscription) => {
                var request = {
                    "subscription": pushSubscription,
                    "metadata": metadata
                }
                listen(callback);
                register(request, cnfg, callback);
                //here call the backend to register
            });
        }, (err) => {
            console.log('device registration failed', err)
        })


}