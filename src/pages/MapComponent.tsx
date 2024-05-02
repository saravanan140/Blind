import React, { useState, useEffect } from 'react';
import GoogleMapReact from 'google-map-react';

const MapComponent = ({ currentLocation }) => {
  return (
    <div style={{ height: '400px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: 'a' }} // Replace with your Google Maps API key
        defaultCenter={{
          lat: currentLocation.latitude,
          lng: currentLocation.longitude
        }}
        defaultZoom={15}
      >
        {/* Marker for current location */}
        <Marker
          lat={currentLocation.latitude}
          lng={currentLocation.longitude}
          text="Your Location"
        />
      </GoogleMapReact>
    </div>
  );
};

// Marker component
const Marker = ({ text }) => <div style={{ color: 'red' }}>{text}</div>;

export default MapComponent;
