import React, { useRef, useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar,IonButton } from '@ionic/react';
import { Plugins, Capacitor } from '@capacitor/core';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';

const { SpeechRecognition, Browser } = Plugins;


const Home: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activated, setActivated] = useState<boolean>(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = { video: {} };
  
        // Check if the app is running on Android
        if (Capacitor.isNative && Capacitor.getPlatform() === 'android') {
          // Access the back camera on Android
          constraints.video = { facingMode: { exact: 'environment' } };
        } else {
          // Access the front camera on other platforms
          constraints.video = { facingMode: 'user' };
        }
  
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };
  
    startCamera();
  
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const navigateToNavigation = () => {
    // You can navigate programmatically using Ionic's history object
    window.location.href = '/navigation';
  };


  const detectObjects = async () => {
    const model = await cocoSsd.load();
    const video = document.createElement('video');
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true });
    video.onloadedmetadata = async () => {
      video.play();
      const predictions = await model.detect(video);
      const objects = predictions.map(prediction => prediction.class);
      const objectsMessage = `Objects detected nearby: ${objects.join(', ')}`;
      speak(objectsMessage);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'green';
      context.lineWidth = 2;
      context.fillStyle = 'green';
      predictions.forEach(prediction => {
        const [x, y, width, height] = prediction.bbox;
        context.beginPath();
        context.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
        context.stroke();
      });

      if (videoRef.current) {
        videoRef.current.srcObject = canvas.captureStream();
      }

      setTimeout(() => {
        window.location.reload();
      }, 10000);
    };
  };


  const speak = (message: string) => {
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  };

  const getCurrentLocation = async () => {
    const coordinates = await Geolocation.getCurrentPosition();
    const locationName = await getLocationName(coordinates);
    return locationName;
  };

  const getLocationName = async (coordinates: GeolocationPosition) => {
    const { latitude, longitude } = coordinates.coords;
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
    const data = await response.json();
    return data.display_name;
  };

  const navigateToDestination = async (destination: string) => {
    try {
      const response = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = response.coords;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&destination_place_id=${latitude},${longitude}`;
      await Browser.open({ url });
    } catch (error) {
      console.error('Error navigating to destination:', error);
      speak('Sorry, I am unable to navigate to the destination.');
    }
  };

  const handleVoiceCommand = async (command: string) => {
    if (command.toLowerCase() === 'activate') {
      detectObjects();
      setActivated(true);
    } else if (command.toLowerCase() === 'reload' && !activated) {
      window.location.reload();
    } else if (command.toLowerCase() === 'location') {
      try {
        const locationName = await getCurrentLocation();
        speak(`You are currently at ${locationName}`);
      } catch (error) {
        console.error('Error getting current location:', error);
        speak('Sorry, I am unable to retrieve your current location.');
      }
    } else if (command.toLowerCase() === 'destination') {
      try {
        speak('Please say the destination location.');
        SpeechRecognition.addListener('result', async (result: any) => {
          const destination = result.results[result.resultIndex];
          await navigateToDestination(destination);
        });
        await SpeechRecognition.startListening({
          language: 'en-US',
          partialResults: true,
          popup: true,
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  useEffect(() => {
    if (Capacitor.isNative) {
      if (Capacitor.getPlatform() === 'android') {
        startAndroidSpeechRecognition();
      }
    } else {
      startWebSpeechRecognition();
    }
  }, []);

  const startAndroidSpeechRecognition = async () => {
    try {
      const result = await SpeechRecognition.requestPermission();
      if (result && result.state === 'granted') {
        startListening();
      } else {
        console.error('Permission denied');
      }
    } catch (error) {
      console.error('Error checking permission:', error);
    }
  };

  const startWebSpeechRecognition = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i][0].transcript.toLowerCase();
        handleVoiceCommand(result);
      }
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };
    recognition.start();

    return () => {
      recognition.stop();
    };
  };

  const startListening = async () => {
    try {
      SpeechRecognition.addListener('result', (result: any) => {
        const command = result.results[result.resultIndex];
        handleVoiceCommand(command);
      });
      await SpeechRecognition.startListening({
        language: 'en-US',
        partialResults: true,
        popup: true,
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Virtual Assistant</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div id='via' style={{ textAlign: 'center' }}>VIRTUAL ASSISTANT</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <video ref={videoRef} autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '80vh' }} />

        </div>
       

      </IonContent>
      <IonButton onClick={navigateToNavigation}>Navigate to Navigation</IonButton>
    </IonPage>
  );
};

export default Home;