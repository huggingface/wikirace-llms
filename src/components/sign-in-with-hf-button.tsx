// Use the code query parameter to get an access token and id token from https://huggingface.co/oauth/token (POST request with client_id, code, grant_type=authorization_code and redirect_uri as form data, and with Authorization: Basic {base64(client_id:client_secret)} as a header).
import { useState } from "react";
import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const CLIENT_ID = "a67ef241-fb7e-4300-a6bd-8430a7565c9a";
// const REDIRECT_URI = "https://huggingfacetb-wikispeedia.hf.space";
// const REDIRECT_URI = "http://localhost:5173/auth/callback";
const REDIRECT_URI = isProd ? "https://huggingfacetb-wikispeedia.hf.space/auth/callback" : "http://localhost:8000/auth/callback";

const SCOPE = "openid%20profile%20email%20inference-api";
const STATE = "1234567890";
const SSO_URL = `https://huggingface.co/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&prompt=consent&state=${STATE}`;

import { isProd } from "@/lib/constants";

export const SignInWithHuggingFaceButton = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    // check if access_token and id_token are in the url
    const accessTokenURL = new URLSearchParams(window.location.search).get("access_token");
    const idTokenURL = new URLSearchParams(window.location.search).get("id_token");

    console.log(accessTokenURL, idTokenURL);

    if (accessTokenURL && idTokenURL) {
      // remove the access_token and id_token from the url
      window.history.replaceState({}, "", window.location.pathname);

      window.localStorage.setItem("huggingface_access_token", accessTokenURL);
      window.localStorage.setItem("huggingface_id_token", JSON.stringify(jwtDecode(idTokenURL)));
    }

    // check if the user is already logged in
    const idToken = window.localStorage.getItem("huggingface_id_token");
    const accessToken = window.localStorage.getItem("huggingface_access_token");

    if (idToken && accessToken) {
      const idTokenObject = JSON.parse(idToken);
      if (idTokenObject.exp > Date.now() / 1000) {
        setIsSignedIn(true);
        setName(idTokenObject.name);

        return;
      }
    }
  
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isSignedIn) {
    return <div>Welcome, {name}</div>;
  }

  return (
    <a href={SSO_URL} rel="nofollow">
      <img
        src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-xl.svg"
        alt="Sign in with Hugging Face"
      />
    </a>
  );
};
