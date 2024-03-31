import React, { useState, useEffect } from 'react';
import './Navigations.css';

const Navigation: React.FC = () => {
  const [destination, setDestination] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation(position.coords);
        // Call function to update navigation based on new location
        updateNavigation(position.coords);
      },
      (error) => {
        console.error('Error getting current location:', error);
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []); // Run effect only once

  const handleVoiceCommand = async () => {
    try {
      speak('Please say the destination location.');
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setDestination(transcript);
        speak(`Destination set to ${transcript}`);
        await navigateToDestination(transcript);
        recognition.stop();
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        recognition.stop();
      };
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const speak = (message: string) => {
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  };

  const updateNavigation = async (coords: GeolocationCoordinates) => {
    try {
      if (!destination) {
        return; // No destination set, no need to update navigation
      }

      const origin = `${coords.latitude},${coords.longitude}`;
      const response = await fetch(`http://localhost:5000/directions?origin=${origin}&destination=${destination}&key=AIzaSyAAsJbXqklEa3dbs-Yd01wwVY10pZ_PR5Y`);
      const data = await response.json();

      if (response.ok) {
        if (data.routes && data.routes.length > 0) {
          const instructions = data.routes[0].legs[0].steps.map((step: any) => step.html_instructions.replace(/<[^>]+>/g, ''));
          setRouteInstructions(instructions);
          speakDirections(instructions.join('\n'));
        } else {
          throw new Error('No route found');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch directions');
      }
    } catch (error) {
      console.error('Error updating navigation:', error);
      speak('Sorry, I encountered an error while updating navigation.');
    }
  };

  const navigateToDestination = async (destination: string) => {
    try {
      if (!currentLocation) {
        throw new Error('Current location not available');
      }

      const response = await fetch(`http://localhost:5000/directions?origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination}&key=AIzaSyAAsJbXqklEa3dbs-Yd01wwVY10pZ_PR5Y`);
      const data = await response.json();

      if (response.ok) {
        if (data.routes && data.routes.length > 0) {
          const instructions = data.routes[0].legs[0].steps.map((step: any) => step.html_instructions.replace(/<[^>]+>/g, ''));
          setRouteInstructions(instructions);
          speak('Starting navigation.');
          speakDirections(instructions.join('\n'));
        } else {
          throw new Error('No route found');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch directions');
      }
    } catch (error) {
      console.error('Error navigating to destination:', error);
      speak('Sorry, I encountered an error while navigating to the destination.');
    }
  };

  const speakDirections = (directions: string) => {
    speak(directions);
  };

  const handleRouteButtonClick = () => {
    if (destination && currentLocation) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination}`, '_blank');
    } else {
      console.error('Destination or current location is not available.');
    }
  };

  return (
    <div className="navigation-container">
      <button className="set-destination-button" onClick={handleVoiceCommand}>Set Destination</button>
      {destination && <p className="destination-text">Destination: {destination}</p>}
      <div className="routes-container">
        <p className="routes-title">Routes:</p>
        <ul className="route-instructions">
          {routeInstructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ul>
      </div>
      {currentLocation && (
        <div className="location-container">
          <p className="location-title">Current Location:</p>
          <p className="latitude">Latitude: {currentLocation.latitude}</p>
          <p className="longitude">Longitude: {currentLocation.longitude}</p>
        </div>
      )}
      {destination && (
        <button className="route-button" onClick={handleRouteButtonClick}>Route</button>
      )}
    </div>
  );
};

export default Navigation;
