// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Route, Routes, Link } from 'react-router-dom';
import HomePage from './pages/home-page/home-page';
import { useEffect, useState } from 'react';
import LoadingScreen from './components/loading/loader';
import { ThemeProvider, createTheme } from '@mui/material';

export function App() {
  const [isLoading, setLoading] = useState(true);

  useEffect(()=>{
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  },[isLoading])
  if(isLoading)
  return(
      <LoadingScreen/>
    )
    const primary = {
      main: '#FFFF',
      light: '#FFFF',
      dark: 'black',
      contrastText: 'black',
  };

  const secondary = {
      main: '#00aeef',
      light: '#00aeef',
      dark: '#00395d',
      contrastText: 'white',
  };

  const theme = createTheme({
      palette: {
          primary: primary,
          secondary: secondary,
      },
  });
  return (
    <ThemeProvider theme={theme}>
    <Routes>
        <Route
          path="/"
          element={
            <HomePage/>
          }
        />
      </Routes>
      {/* END: routes */}
    </ThemeProvider>
  );
}

export default App;
