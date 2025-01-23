import Head from "next/head";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useRef, useEffect } from "react";
import ThreeDWorld from "@/components/screens/ThreeDWorld";
import LoadingScreen from "@/components/screens/LoadingScreen";
import MainView from "@/components/screens/MainView";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [stage, setStage] = useState('initial'); // 'initial', 'mac', 'loading', or 'computer'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [screenWidth, setScreenWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const progressRef = useRef(0);

  // Handle screen resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      const mobile = width < 768; // Standard mobile breakpoint
      setIsMobile(mobile);
      if (mobile) {
        console.log('Mobile view detected:', width);
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuthentication = async (token) => {
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.userData) {
        localStorage.setItem('authToken', token);
        setUserData(data.userData);
        setIsLoggedIn(true);
        setStage('computer');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error authenticating:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check for auth token on mount
    const authToken = localStorage.getItem('token');
    if (authToken) {
      // Don't set isLoggedIn until we verify the token
      
      // Fetch user data
      fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.userData) {
          setUserData(data.userData);
          setIsLoggedIn(true);
          setStage('computer');
        } else {
          // Silently handle invalid token
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          setStage('mac');
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        setStage('mac');
      });
    } else {
      setStage('mac'); // Start with 3D world if not logged in
    }
  }, []);

  useEffect(() => {
    if (stage === 'loading') {
      const startTime = Date.now();
      const duration = 12500;
      let animationFrame;

      const easeInOutCubic = (x) => {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      };

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(rawProgress) * 100;
        
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
          progressBar.style.width = `${easedProgress}%`;
        }

        if (rawProgress < 1) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          setStage('computer');
        }
      };

      animationFrame = requestAnimationFrame(updateProgress);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [stage]);

  return (
    <>
      <Head>
        <title>Juice</title>
        <meta name="description" content="juice" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isMobile ?
      <main className={styles.main}>
        {stage === 'mac' && <ThreeDWorld onDiskInserted={() => setStage('loading')} />}
        {stage === 'loading' && <LoadingScreen />}
        {stage === 'computer' && (
          <MainView 
            isLoggedIn={isLoggedIn} 
            setIsLoggedIn={setIsLoggedIn} 
            userData={userData}
            setUserData={setUserData}
            onAuthenticate={handleAuthentication}
          />
        )}
      </main> : 
      <main style={{margin: 16, display: "flex", justifyContent: "center", flexDirection: "column", color: "#47251D"}}>
        <div style={{backgroundColor: "#47251D", color: "#fff", margin: -16, padding: 16}}>
          <p style={{fontSize: 24, marginBottom: 16}}>You're on the mobile version of the site which is unfortunately quite lame compared to the desktop version! Open juice.hackclub.com on your laptop</p>
        </div>
                <img style={{width: "100%", border: "4px solid #fff", imageRendering: "pixelated"}} src="./background.gif"/>
        <p style={{fontSize: 48}}>Juice</p>
        <p style={{fontSize: 24}}>2 Month Game Jam Followed by Popup Cafe in Shanghai, China (flight stipends available).</p>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '16px',
          marginBottom: '16px'
        }}>
          <input 
            style={{
              flex: 1,
              fontSize: '18px',
              padding: '12px 16px',
              border: '2px solid #47251D',
              borderRadius: '12px',
              backgroundColor: '#fff',
              color: '#000',
              outline: 'none',
              transition: 'all 0.2s ease',
              WebkitAppearance: 'none'
            }}
            placeholder="Enter your email..."
            type="email"
            autoComplete="email"
          />
          <button style={{
            fontSize: '18px',
            padding: '12px 24px',
            backgroundColor: '#47251D',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>Sign Up</button>
        </div>
        <p></p>
      </main>}
    </>
  );
}
