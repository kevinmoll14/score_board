const serviceUUID = 0xFFE0;
const serialUUID = 0xFFE1;

let device;
let serialCharacteristic;

async function connect() {

    device = await navigator.bluetooth.requestDevice({
        filters: [{
            services: [serviceUUID]
        }],
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(serviceUUID);

    serialCharacteristic = await service.getCharacteristic(serialUUID);

    await serialCharacteristic.startNotifications();

    serialCharacteristic.addEventListener('characteristicvaluechanged', read);

    document.getElementById('connect').removeEventListener("click", connect);
    document.getElementById('connect').addEventListener("click", disconnect);
    document.getElementById('connect').textContent = "Disconnect";
}

function disconnect() {
    device.gatt.disconnect();

    document.getElementById('connect').removeEventListener("click", disconnect);
    document.getElementById('connect').addEventListener("click", connect);
    document.getElementById('connect').textContent = "Connect";
}

function read(event) {
    let buffer = event.target.value.buffer;
    let view = new Uint8Array(buffer);
    let decodedMessage = String.fromCharCode.apply(null, view);

    let newNode = document.createElement('p');
    newNode.classList.add("received-message");
    newNode.textContent = decodedMessage;

    document.getElementById("terminal").appendChild(newNode);

    let placeholder = document.getElementsByClassName('placeholder');
    if (placeholder.length != 0) placeholder[0].remove();
}

async function write(event) {
    let message = document.getElementById("message-input").value;
    message += '\n';
    let buffer = new ArrayBuffer(message.length);
    let encodedMessage = new Uint8Array(buffer);

    for (let i = 0; i < message.length; i++) {
        encodedMessage[i] = message.charCodeAt(i);
    }

    await serialCharacteristic.writeValue(encodedMessage);
}

async function send_string(message) {
    let buffer = new ArrayBuffer(message.length);
    let encodedMessage = new Uint8Array(buffer);

    for (let i = 0; i < message.length; i++) {
        encodedMessage[i] = message.charCodeAt(i);
    }

    await serialCharacteristic.writeValue(encodedMessage);
}

async function increment_score(event) {
    let team = this.attributes.team.value;
    await send_string("s" + team + ":+;\n");
}

async function decrement_score(event) {
    let team = this.attributes.team.value;
    await send_string("s" + team + ":-;\n");
}

async function set_score(event) {
    let team = this.attributes.team.value;
    let score_field = this.attributes.score_field.value;
    let score_field_element = document.getElementById(score_field);
    await send_string("s" + team + ":" + score_field_element.value + ";");
}

function validate_score_inputs(event) {
    var min = parseInt(this.min);
    var max = parseInt(this.max);

    if (parseInt(this.value) > max) {
        this.value = max;
    } else if (parseInt(this.value) < min) {
        this.value = min;
    }
}

document.getElementById('connect').addEventListener("click", connect);
document.getElementById('send').addEventListener("click", write);
document.getElementById('score_1_inc').addEventListener("click", increment_score);
document.getElementById('score_2_inc').addEventListener("click", increment_score);
document.getElementById('score_1_dec').addEventListener("click", decrement_score);
document.getElementById('score_2_dec').addEventListener("click", decrement_score);
document.getElementById('score_1_set').addEventListener("click", set_score);
document.getElementById('score_2_set').addEventListener("click", set_score);
document.getElementById('team_1_score').oninput = validate_score_inputs;
document.getElementById('team_2_score').oninput = validate_score_inputs;
