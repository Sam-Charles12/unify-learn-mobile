import { registerRootComponent } from 'expo';
import './global.css';
import App from './src/navigation/AppNavigator';
import { FontLoader } from '@/hooks/useFonts';

const RootApp = () => (
  <FontLoader>
    <App />
  </FontLoader>
);

export default RootApp;
registerRootComponent(RootApp);
