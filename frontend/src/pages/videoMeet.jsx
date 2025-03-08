import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import {io} from 'socket.io-client'
import "../styles/videoComponent.css";

const server_url = "http://localhost:8080";
var connection = {};

const peerConfigConnections = {
  "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }],
};
export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  let [socketId, setSocketId] = useState(""); // Add state variable for socketId

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  //TODO
  //if(isChrome === false){
  //}

 
  const getPermission = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }
      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }
      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if(userMediaStream){
          window.localStream = userMediaStream;
          if(localVideoRef.current){
            localVideoRef.current.srcObject = userMediaStream;
            // localVideoRef.current.play();
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPermission();
  });

  let getUserMediaSucess =(stream)=>{
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e)
    }
    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for(let id in connection){
      if(id === socketIdRef.current) continue;

      connection[id].addStream(window.localStream)

      connection[id].createOffer().then((description) =>{
        console.log(description)
        connection[id].setLocalDescription(description)
        .then(()=>{
          socketIdRef.current.emit("signal", id, JSON.stringify({"sdp": connection[id].localDescription}))
        }).catch(e=>console.log(e));
      })
    }
    stream.getTracks().forEach(track => track.onended=()=>{
      setVideo(false);
      setAudio(false);
  
      try {
        let tracks = localVideoRef.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) {
        console.log(e)
      }
      //Blacksilence
      let blackSilence = (...args)=> new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoRef.current.srcObject = window.localStream;
  
      for(let id in connection){
        connection[id].addStream(window.localStream)
  
        connection[id].createOffer().then((description)=>{
          connection[id].setLocalDescription(description)
          .then(()=>{
            socketRef.current.emit("signal", id, JSON.stringify({"sdp": connection[id].localDescription}))
          }).catch(e=> console.log(e))
        })
      }
    })
  }

  

  let getUserMedia = ()=>{
    if((video && videoAvailable) || (audio && audioAvailable)){
      navigator.mediaDevices.getUserMedia({video: video, audio: audio})
      .then(getUserMediaSucess) //Todo getUserMediaSucess
      .then((stream)=>{})
      .catch((err)=>console.log(err))
    }else{
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (err) { }
    }
  }
  
  useEffect(() =>{
    if(video !== undefined && audio !== undefined){
      getUserMedia();
    }
  },[video, audio])


  //TODO
  let gotMessageFromServer = (fromId, message) =>{
    var signal = JSON.parse(message);

    if(fromId !== socketIdRef.current){
      if(signal.sdp){
        connection[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(()=>{
          if(signal.sdp.type === "offer"){

            connection[fromId].createAnswer().then((description)=>{
              connection[fromId].setLocalDescription(description).then(()=>{
                socketIdRef.current.emit("signal", fromId, JSON.stringify({"sdp":connection[fromId].localDescription}))
              }).catch(e => console.log(e))
            }).catch(e =>console.log(e))
          }
        }).catch(e=>console.log(e))
      }
      if(signal.ice){
        connection[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e=>console.log(e));
      }
    }
  }



  //addMessage
  let addMessage = () =>{

  }
  let connectToSocketServer = ()=>{
    socketRef.current = io.connect(server_url, {secure: false})

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', ()=>{

      socketRef.current.emit("join-call",  window.location.href)
       
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage)

      socketRef.current.on("user-Left",(id)=>{
        setVideos((videos)=>videos.filter((video)=> video.socketId !== id))
      })
      socketRef.current.on("user-joined", (id, clients) =>{
        clients.forEach((socketListId) =>{
          connection[socketListId] = new RTCPeerConnection(peerConfigConnections)

          connection[socketListId].onicecandidate = (event)=>{
            if(event.candidate != null){
              socketRef.current.emit("signal", socketListId, JSON.stringify({ice: event.candidate}))
            }
          };
          // connection[socketListId].onaddstream = (event) =>{
          //   console.log("Before", videoRef.current);
          //   console.log("FINDING It", socketListId)

          //   let videoExists = videoRef.current.find(video=> video.socketId === socketListId);

          //   if(videoExists){
          //     console.log("found existing")
          //     setVideos(videos =>{
          //       const updatedVideos = videos.map(video =>
          //         video.socketId === socketListId ? {...video, stream: event.stream} : video
          //       );
          //       videoRef.current = updatedVideos;
          //       return updatedVideos
          //     }) 
          //   }else {
          //     console.log("Creating New")
          //     let newVideo ={
          //       socketId: socketListId,
          //       stream : event.stream,
          //       autoPlay: true,
          //       playsinline: true
          //     }
          //     setVideos(videos =>{
          //       const updatedVideos = [...videos,newVideo];
          //       videoRef.current = updatedVideos;
          //       return updatedVideos;
          //     });
          //   }
          // };
          connection[socketListId].ontrack = (event) =>{
            let stream = event.stream[0];
            setVideos((videos) =>{
              const updatedVideos = videos.filter(
                (video) => video.socketId !== socketListId
              );
              const newVideo = {socketId: socketListId, stream};
              videoRef.current = [...updatedVideos, newVideo];
              return [...updatedVideos, newVideo];
            });
          };
          if(window.localStream !== undefined && window.localStream !== null){
            connection[socketListId].addStream(window.localStream);
          }else{
            //TODO BLACKSILENCE
            //let BLACKSILENCE

            let blackSilence = (...args)=> new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connection[socketListId].addStream(window.localStream);
          }
        });
        if(id === socketIdRef.current){
          for(let id2 in connection){
            if(id2 === socketIdRef.current) continue
            try {
              connection[id2].addStream(window.localStream)
            } catch (e) { }
            connection[id2].createOffer().then((description)=>{
              connection[id2].setLocalDescription(description)
              .then(()=>{
                socketRef.current.emit("signal", id2, JSON.stringify({'sdp': connection[id2].localDescription}))
              })
              .catch( e => console.log(e));
            })
          }
        }
      })
    })
  }


let silence = ()=>{
  let ctx = new AudioContext()
  let oscillator = ctx.createOscillator();

  let dst = oscillator.connect(ctx.createMediaStreamDestination());

  oscillator.start();
  ctx.resume()
  return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
}
let black = ({ width = 640, height = 480} = {})=>{
  let canvas = Object.assign(document.createElement("canvas"), {width, height});

  canvas.getContext('2d').fillRect(0, 0, width, height);

  let stream = canvas.captureStream();

  return Object.assign(stream.getVideoTracks()[0], {enabled: false})
}
  
  let getMedia = ()=>{
    setVideo(setVideoAvailable);
    setAudio(setAudioAvailable);
    connectToSocketServer();
  }
  let connect = ()=>{
    setAskForUsername(false);
    getMedia();
  }
  return (
    <div>
      {askForUsername === true ?
      <div>
        <h2>Enter into Loby</h2>
          <TextField
            id="outlined-basic"
            label="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>Connect</Button>
          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
      </div>: <>
      <video ref={localVideoRef} autoPlay muted></video>
      { videos.map((video)=>{
         <div key={video.socketId}>
            <h2>{video.socketId}</h2>
          </div>
        })
      }
      </>

    }
    </div>
  );
}
