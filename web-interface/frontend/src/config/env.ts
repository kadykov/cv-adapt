interface Config {
  apiBaseUrl: string;
  apiVersion: string;
  authTokenKey: string;
}

const development: Config = {
  apiBaseUrl: "http://localhost:8000",
  apiVersion: "v1",
  authTokenKey: "cv_adapt_auth_token",
};

const production: Config = {
  apiBaseUrl: "/api",
  apiVersion: "v1",
  authTokenKey: "cv_adapt_auth_token",
};

const config: Config =
  import.meta.env.PROD ? production : development;

export default config;
