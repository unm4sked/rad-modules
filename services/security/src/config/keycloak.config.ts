import { Joi } from "celebrate";

export const KeycloakClientConfigSchema = Joi.object({
  clientConfigJsonPath: Joi.string().required(),
  keycloakAuthClientConfig: Joi.object().unknown(),
  keycloakManagerConfig: Joi.object({
    keycloakUrl: Joi.string().uri().required(),
    realmName: Joi.string().required(),
    clientUsername: Joi.string().required(),
    clientPassword: Joi.string().required(),
    clientSecret: Joi.string().required(),
    grantType: Joi.string().required(),
    clientId: Joi.string().required(),
    radSecurityClientId: Joi.string().required(),
  }).required(),
});

export interface KeycloakAuthenticationClientConfig {
  realm: string;
  "auth-server-url": string;
  "ssl-required": string;
  resource: string;
  "verify-token-audience": boolean;
  credentials: {
    secret: string;
  };
  port?: number;
  "confidential-port"?: number;
  "policy-enforcer"?: any;
}

export type KeycloakManagerConfig = {
  keycloakUrl: string;
  realmName: string;
  clientUsername: string;
  clientPassword: string;
  clientSecret: string;
  grantType: string;
  clientId: string;
  radSecurityClientId: string;
};

export type KeycloakClientConfig = {
  clientConfigJsonPath: string;
  keycloakAuthClientConfig: KeycloakAuthenticationClientConfig;
  keycloakManagerConfig: KeycloakManagerConfig;
};

export const getKeycloakClientConfig = (): KeycloakClientConfig => ({
  clientConfigJsonPath:
    process.env.KEYCLOAK_CLIENT_CONFIG_JSON_PATH || "/app/services/security/init-data-volume/keycloak.json",
  keycloakAuthClientConfig: {
    realm: "rad-security-auth",
    "auth-server-url": "http://keycloak:8090/auth/realms/rad-security-auth/protocol/openid-connect/token",
    "ssl-required": "external",
    resource: "rad-security",
    "verify-token-audience": true,
    credentials: {
      secret: "5aced109-cebb-49c5-8d8e-93582c6ff898",
    },
    "confidential-port": 0,
    "policy-enforcer": {},
  },
  keycloakManagerConfig: {
    keycloakUrl: process.env.KEYCLOAK_URL || "http://keycloak:8090",
    realmName: process.env.KEYCLOAK_REALM_NAME || "rad-security-auth",
    clientUsername: process.env.KEYCLOAK_ADMIN_USERNAME || "admin",
    clientPassword: process.env.KEYCLOAK_ADMIN_PASSWORD || "password",
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || "7680c12c-4430-40e0-8968-b73c99b4dcf0",
    grantType: "password",
    clientId: process.env.KEYCLOAK_CLIENT_ID || "rad-security",
    radSecurityClientId: process.env.KEYCLOAK_SECURITY_CLIENT_ID || "6c3465b1-2674-4704-a940-c41194dbd951",
  },
});
