import React, { useEffect } from 'react';
import { Plugins, PermissionState } from '@capacitor/core';

const { Permissions } = Plugins;

const PermissionCheck: React.FC = () => {
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const result = await Permissions.query({ name: 'microphone' });
      if (result.state === PermissionState.Granted) {
        console.log('Microphone permission is granted.');
      } else if (result.state === PermissionState.Denied) {
        console.log('Microphone permission is denied.');
      } else {
        console.log('Microphone permission is not yet determined.');
      }
    } catch (error) {
      console.error('Error checking microphone permission:', error);
    }
  };

  return (
    <div>
      <h1>Permission Check</h1>
      <p>Check the browser console for microphone permission status.</p>
    </div>
  );
};

export default PermissionCheck;
