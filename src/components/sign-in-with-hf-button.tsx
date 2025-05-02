// Use the code query parameter to get an access token and id token from https://huggingface.co/oauth/token (POST request with client_id, code, grant_type=authorization_code and redirect_uri as form data, and with Authorization: Basic {base64(client_id:client_secret)} as a header).
import { useState } from "react";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const CLIENT_ID = "a67ef241-fb7e-4300-a6bd-8430a7565c9a";
const REDIRECT_URI = "https://huggingfacetb-wikispeedia.hf.space";
// const REDIRECT_URI = "http://localhost:5173/auth/callback";
const SCOPE = "openid%20profile%20email%20inference-api";
const STATE = "1234567890";
const SSO_URL = `https://huggingface.co/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&prompt=consent&state=${STATE}`;
const OAUTH_API_BASE = "https://huggingface.co/oauth/token";
const CLIENT_SECRET = import.meta.env.VITE_HUGGINGFACE_CLIENT_SECRET; // THIS IS UNSAFE, must fix before real deploy

import { oauthLoginUrl, oauthHandleRedirectIfPresent } from "@huggingface/hub";

export const SignInWithHuggingFaceButton = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState<string | null>(null);

  // useEffect(() => {
  //   const idToken = window.localStorage.getItem("huggingface_id_token");
  //   const accessToken = window.localStorage.getItem("huggingface_access_token");

  //   if (idToken && accessToken) {
  //     const idTokenObject = JSON.parse(idToken);
  //     if (idTokenObject.exp > Date.now() / 1000) {
  //       setIsSignedIn(true);
  //       setName(idTokenObject.name);

  //       return;
  //     }
  //   }

  //   async function fetchToken() {
  //     const code = new URLSearchParams(window.location.search).get("code");
  //     if (code) {
  //       // remove the code from the url
  //       window.history.replaceState({}, "", window.location.pathname);
  //       setIsLoading(true);
  //       const response = await fetch(`${OAUTH_API_BASE}`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/x-www-form-urlencoded",
  //           Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
  //         },
  //         body: new URLSearchParams({
  //           client_id: CLIENT_ID,
  //           code,
  //           grant_type: "authorization_code",
  //           redirect_uri: REDIRECT_URI
  //         }).toString(),
  //       });
  //       const data = await response.json();
  //       window.localStorage.setItem("huggingface_access_token", data.access_token);

  //       // parse the id_token
  //       const idToken = jwtDecode(data.id_token);
  //       console.log(idToken);
  //       window.localStorage.setItem("huggingface_id_token", JSON.stringify(idToken));
  //       setName(idToken.name);
  //       setIsSignedIn(true);
  //       setIsLoading(false);
  //     }
  //   }

  //   fetchToken();
  // }, []);

  useEffect(() => {
    async function fetchToken() {
      console.log("fetching token", window.location.href);
      const oauthResult = await oauthHandleRedirectIfPresent();

      if (!oauthResult) {
        // If the user is not logged in, redirect to the login page
        window.location.href = await oauthLoginUrl();
      }

      // You can use oauthResult.accessToken, oauthResult.accessTokenExpiresAt and oauthResult.userInfo
      console.log(oauthResult);
    }

    fetchToken();
  }, []);

  const handleLogin = async () => {
    window.location.href =
      (await oauthLoginUrl({
        scopes: window.huggingface.variables.OAUTH_SCOPES,
      })) + "&prompt=consent";
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isSignedIn) {
    return <div>Welcome, {name}</div>;
  }

  return (
    <a onClick={handleLogin} href="#" rel="nofollow">
      <img
        src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-xl.svg"
        alt="Sign in with Hugging Face"
      />
    </a>
  );
};
