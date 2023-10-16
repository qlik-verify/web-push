function QlikVerify() {
}

function removeIframeCookies() {
    // Access the iframe element
    var iframe = document.getElementById('qv-popup-iframe'); // Replace with your iframe's actual ID

    // Access the iframe's document and its cookies
    var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    var iframeCookies = iframeDocument.cookie.split('; ');

    // Iterate through the iframe's cookies and delete them
    for (var i = 0; i < iframeCookies.length; i++) {
        var cookie = iframeCookies[i].split('=');
        var cookieName = cookie[0];
        document.cookie = cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
}

// Usage example: deleteCookiesForDomain('example.com');



const appendTags = (url) => {
    removeIframeCookies();
    if (!document.getElementById("qv-overlay")) {
        // Create a new <div> element
        var newDiv = document.createElement("div");

        // Set some attributes for the div (optional)
        newDiv.id = "qv-overlay";

        // Append the new <div> element to the <body> tag
        document.body.appendChild(newDiv);
    }
    var timestamp = new Date().getTime();

    if (!document.getElementById("qv-popup")) {
        // Create a new <div> element
        var newDiv = document.createElement("div");

        // Set some attributes for the div (optional)
        newDiv.id = "qv-popup";
        newDiv.innerHTML = '<iframe src=' + url + '?'+timestamp+' id="qv-popup-iframe"></iframe>';

        // Append the new <div> element to the <body> tag
        document.body.appendChild(newDiv);
    }
    else {
        let iframe = document.getElementById("qv-popup-iframe");
        iframe.src = url+ '?'+timestamp;
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


const request = async (data, opts, callback) => {
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
            callback({ type: "register", "success": false, "reason": `Register Failed: ${response.status}` });
        }
        else {
            let res = await response.json();
            if(res.listen)
            {
                listen(res.trxId,res.pollUrl,callback);
            }
            appendTags(res.url);
        }

    } catch (error) {
        callback({ type: "register", "success": false, "reason": `Error: ${error}` });
    }
}

const listen = (trxId,pollUrl,callback) => {

    let socket = io(pollUrl, { transports: ['websocket'] });
    socket.auth = {trxId};
    socket.connect();
    socket.on(trxId, function (event) {
        console.log(event);
        $("#event").append("<p>" + JSON.stringify(event) + "</p>");
        $("#event").append("<p>--------------------------------------------</p>")
        callback(event);
    });
    socket.on('connect', function () {
        console.log("Connection established, waiting for messages");
        $("#status").append("<p>Connection established, waiting for messages</p>");
        $("#status").append("<p>--------------------------------------------</p>")
    });
}

QlikVerify.prototype.request = function (metadata, cnfg, callback) {
    var trxRequest = {
        "metadata": metadata
    }
    request(trxRequest, cnfg, callback);
}