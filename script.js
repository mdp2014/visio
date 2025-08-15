const videoGrid = document.getElementById('video-grid');
const joinSound = document.getElementById('join-sound');

const toggleMicBtn = document.getElementById('toggle-mic');
const toggleCamBtn = document.getElementById('toggle-cam');

const ROOM_ID = "ma-salle-unique-visio";
const peer = new Peer(undefined, {
    host: '0.peerjs.com',
    port: 443,
    secure: true
});

let myStream;
let micEnabled = true;
let camEnabled = true;

const myVideoContainer = document.createElement('div');
myVideoContainer.classList.add('video-container');

const myVideo = document.createElement('video');
myVideo.muted = true;

const myLabel = document.createElement('div');
myLabel.classList.add('name-label');
const myName = prompt("Entrez votre nom ou surnom :") || "Anonyme";
myLabel.innerText = myName;

myVideoContainer.appendChild(myVideo);
myVideoContainer.appendChild(myLabel);

const peers = {};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
.then(stream => {
    myStream = stream;
    addVideoStream(myVideoContainer, myVideo, stream);

    peer.on('call', call => {
        call.answer(stream);
        const { videoEl, labelEl, containerEl } = createVideoElement("Participant");
        call.on('stream', userVideoStream => {
            if (!peers[call.peer]) {
                addVideoStream(containerEl, videoEl, userVideoStream);
                joinSound.play();
            }
            peers[call.peer] = call;
        });
    });

    peer.on('open', id => {
        fetch(`https://0.peerjs.com/peers`)
        .then(res => res.json())
        .then(ids => {
            ids.forEach(otherId => {
                if (otherId !== id) {
                    connectToNewUser(otherId, stream);
                }
            });
        })
        .catch(() => console.log("Impossible de récupérer la liste des pairs"));
    });
});

// Création d’un nouvel élément vidéo avec nom
function createVideoElement(name) {
    const container = document.createElement('div');
    container.classList.add('video-container');

    const video = document.createElement('video');
    const label = document.createElement('div');
    label.classList.add('name-label');
    label.innerText = name;

    container.appendChild(video);
    container.appendChild(label);

    return { videoEl: video, labelEl: label, containerEl: container };
}

function connectToNewUser(userId, stream) {
    const { videoEl, labelEl, containerEl } = createVideoElement("Participant");
    const call = peer.call(userId, stream);
    call.on('stream', userVideoStream => {
        if (!peers[userId]) {
            addVideoStream(containerEl, videoEl, userVideoStream);
            joinSound.play();
        }
        peers[userId] = call;
    });
}

function addVideoStream(container, video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(container);
}

// Bouton micro ON/OFF
toggleMicBtn.addEventListener('click', () => {
    micEnabled = !micEnabled;
    myStream.getAudioTracks()[0].enabled = micEnabled;
    toggleMicBtn.textContent = micEnabled ? "🎤 Micro OFF" : "🔇 Micro ON";
});

// Bouton caméra ON/OFF
toggleCamBtn.addEventListener('click', () => {
    camEnabled = !camEnabled;
    myStream.getVideoTracks()[0].enabled = camEnabled;
    toggleCamBtn.textContent = camEnabled ? "📷 Caméra OFF" : "📷 Caméra ON";
});
