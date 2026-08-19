import { registerRootComponent } from 'expo';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import './global.css';
import App from './src/navigation/AppNavigator';
import { FontLoader } from '@/hooks/useFonts';
import { initAnalytics, logEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const RootApp = () => {
  useEffect(() => {
    initAnalytics();
    logEvent(ANALYTICS_EVENTS.appOpen);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        logEvent(ANALYTICS_EVENTS.appBackgrounded);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <FontLoader>
      <App />
    </FontLoader>
  );
};

export default RootApp;
registerRootComponent(RootApp);